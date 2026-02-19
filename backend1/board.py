from fastapi import APIRouter, Depends,Cookie
from pydantic import BaseModel, Field
from db import findAll, findOne, save, add_key
from auth import get_user
import math

router = APIRouter(prefix="/board", tags=["게시판"])

class BoardAddModel(BaseModel):
  title: str = Field(..., title="제목", description="게시글 제목 입니다.")
  content: str = Field(..., title="내용", description="게시글 내용 입니다.")

class BoardSearchModel(BaseModel):
  page: int = Field(..., title="페이지번호", description="게시글 페이징 현제 위치 정보 입니다.")
  search: str = Field(..., title="제목 검색", description="게시글에서 제목 검색 값 입니다.")

class BoardEditModel(BaseModel):
   content: str  = Field(..., title="내용", description="게시글에서 수정할 내용 입니다.")

# 댓글 전송을 위한 모델
class ReplyAddModel(BaseModel):
    content: str = Field(..., title="내용", description="댓글 내용입니다.")
    board_no: int = Field(..., title="게시글 번호")

class CommentEditModel(BaseModel):
  content: str = Field(..., title="댓글 내용")


@router.post("/add")  
def board(boardAddModel: BoardAddModel, payload=Depends(get_user), user: str = Cookie(None)):
  if not payload or not user:
    return {"status": False, "message": "로그인이 필요합니다."}

  login_row = findOne(f"SELECT `user_no` FROM mini.`login` WHERE `id`='{user}'")
  if not login_row:
    return {"status": False, "message": "로그인 정보가 없습니다."}

  sql = (
    f"INSERT INTO mini.`board` (`title`, `content`, `user_no`) "
    f"VALUES ('{boardAddModel.title}', '{boardAddModel.content}', {login_row['user_no']})"
  )
  data = add_key(sql)
  if data[0]:
    return {"status": True, "message": "게시글 추가 완료", "result": data[1]}
  return {"status": False, "message": "게시글 추가 중 오류"}

@router.post("")
def board(boardSearchModel: BoardSearchModel):
  cnt = 5
  sql1 = f"""SELECT b.`no`, b.`title`, b.`content`, u.`name`
      FROM mini.`board` AS b
     INNER JOIN mini.`user` AS u
        ON (b.`user_no` = u.`no` AND u.`del_yn` = 0)
     WHERE b.`del_yn` = 0 
       AND b.`title` LIKE '%{boardSearchModel.search}%' 
     ORDER BY 1 desc
     LIMIT {boardSearchModel.page * cnt}, {cnt}
  """
  result = findAll(sql1)
  pagination = {"page": boardSearchModel.page + 1, "total": 0}
  if len(result) > 0:
    sql2 = sql = f"""SELECT count(*) as total 
      FROM mini.`board` AS b
    INNER JOIN mini.`user` AS u
        ON (b.`user_no` = u.`no` AND u.`del_yn` = 0)
    WHERE b.`del_yn` = 0 
      AND b.`title` LIKE '%{boardSearchModel.search}%'
    """
    total = findOne(sql2)
    if total:
      pagination["total"] = math.ceil(total["total"] / cnt)
    return {"status": True, "result": result, "pagination": pagination}
  return {"status": False, "result": [], "pagination": pagination, "message": "게시글은 존재 하지 않습니다."}

@router.post("/{no}")
def board(no: int, payload = Depends(get_user)):
  sql = f"""SELECT b.`no`, b.`title`, b.`content`, u.`name`, b.`user_no`
      FROM mini.`board` AS b
    INNER JOIN mini.`user` AS u
        ON (b.`user_no` = u.`no` AND u.`del_yn` = 0)
    WHERE b.`del_yn` = 0 
      AND b.`no` = {no}
  """
  result = findOne(sql)
  if result:
    if payload:
      role = int(payload["sub"]) == result["user_no"]
    else:
      role = False
    return {"status": True, "result": result, "role": role}
  return {"status": False, "message": "요청하신 게시글은 존재 하지 않습니다."}


  # ✅ 1. 댓글 목록 조회 (프론트엔드의 load_reply 대응)
@router.post("/{no}/comment")
def get_replies(no: int, payload = Depends(get_user)):
    # reply 테이블과 user 테이블을 조인하여 댓글 목록을 가져옵니다.
    sql = f"""
        SELECT r.`no`, r.`content`, u.`name`, r.`reg_date`, r.`user_no`
          FROM mini.`reply` AS r
         INNER JOIN mini.`user` AS u ON (r.`user_no` = u.`no`)
         WHERE r.`board_no` = {no} AND r.`del_yn` = 0
         ORDER BY r.`no` DESC
    """
    result = findAll(sql)
    
    # 각 댓글의 작성자가 현재 로그인한 사용자인지 확인하여 role 부여
    for item in result:
        if payload and int(payload["sub"]) == item["user_no"]:
            item['role'] = True
        else:
            item['role'] = False
            
    return {"status": True, "result": result}

# ✅ 2. 댓글 등록 (프론트엔드의 reply_submit 대응)
@router.post("/{no}/comment/add")
def add_reply(no: int, reply: ReplyAddModel, payload = Depends(get_user)):
    if not payload:
        return {"status": False, "message": "로그인이 필요합니다."}

    user_no = payload["sub"]
    
    # reply 테이블에 데이터를 저장합니다.
    sql = f"""
        INSERT INTO mini.`reply` (`content`, `board_no`, `user_no`)
        VALUES ('{reply.content}', {no}, {user_no})
    """
    res = save(sql)
    
    if res:
        return {"status": True, "message": "댓글이 등록되었습니다."}
    return {"status": False, "message": "댓글 등록 중 오류가 발생했습니다."}

# ✅ 3. 댓글 삭제 (프론트엔드의 reply_delete 대응)
@router.delete("/{no}/comment/{comment_no}")
def delete_reply(no: int, comment_no: int, payload = Depends(get_user)):
    if not payload:
        return {"status": False, "message": "권한이 없습니다."}

    # 본인의 댓글만 삭제할 수 있도록 user_no 조건을 추가합니다.
    user_no = payload["sub"]
    sql = f"UPDATE mini.`reply` SET `del_yn` = 0 WHERE `no` = {comment_no} AND `user_no` = {user_no}"
    
    res = save(sql)
    if res:
        return {"status": True, "message": "댓글이 삭제되었습니다."}
    return {"status": False, "message": "댓글 삭제 실패"}

# 댓글 수정
@router.patch("/{no}/comment/{comment_no}")
def edit_comment(no: int, comment_no: int, commentEditModel: CommentEditModel, payload=Depends(get_user)):
  if not payload:
    return {"status": False, "message": "로그인이 필요합니다."}

  user_no = int(payload["sub"])

  check = findOne(f"SELECT user_no FROM mini.reply WHERE no={comment_no} AND del_yn=0")
  if not check or check["user_no"] != user_no:
    return {"status": False, "message": "권한이 없습니다."}

  result = save(f"UPDATE mini.reply SET content='{commentEditModel.content}', mod_date=NOW() WHERE no={comment_no}")
  if result:
    return {"status": True, "message": "댓글 수정 완료"}
  return {"status": False, "message": "댓글 수정 실패"}


@router.patch("/edit")
def edit_data(no: int, boardEditModel: BoardEditModel, playload = Depends(get_user)):
   if playload:
      sql = f"""
            UPDATE mini.`board` 
            SET `content` = '{boardEditModel.content}' WHERE `no` = {no}
            """
      if save(sql):
         return{"status": True, "message":"게시글이 수정되었습니다."}
   return{"status": False,"message":"게시글 수정중 오류발생"} 

@router.delete("/{no}")
def board(no: int, payload = Depends(get_user)):
  if payload:
    sql = f"UPDATE mini.`board` SET `del_yn` = 1 WHERE `no` = {no}"
    if save(sql):
      return {"status": True, "message": "게시글 삭제가 정상 처리가 되었습니다."}
  return {"status": False, "message": "게시글 삭제 중 오류가 발생 되었습니다."}



