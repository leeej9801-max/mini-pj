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