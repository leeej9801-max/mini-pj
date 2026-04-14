from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, EmailStr
from db import findOne, save
from auth import get_user

router = APIRouter(prefix="/user", tags=["사용자"])

class UserModel(BaseModel):
  email: EmailStr = Field(..., title="이메일 주소", description="사용자 식별를 위한 이메일 주소 입니다.")

@router.post("")
def user(payload = Depends(get_user)):
  if payload:
    sql = f"""SELECT `no`, `name`, `email`,`gender`,`origin`,`ext`,`new_name`, 
                     DATE_FORMAT(reg_date, '%Y-%m-%d') as regDate, 
                     DATE_FORMAT(mod_date, '%Y-%m-%d') as modDate 
                FROM mini.`user` 
               WHERE `del_yn` = 0  AND `no` = {payload["sub"]}
    """
    result = findOne(sql)
    role = False
    if result:
      role = True
    return {"status": True, "result": result, "role": role}
  return {"status": False, "message": "요청하신 사용자 정보는 존재 하지 않습니다."}

@router.patch("")
def user(userModel: UserModel, payload = Depends(get_user)):
  if payload:
    sql = f"""UPDATE mini.`user` SET 
        `email` = '{userModel.email}',
        `mod_date` = NOW()
        WHERE `no` = {payload["sub"]}
    """
    if save(sql):
      return {"status": True, "message": "사용자 수정이 정상 처리 되었습니다."}
  return {"status": False, "message": "사용자 수정 중 오류가 발생 되었습니다."}

@router.delete("")
def user(payload = Depends(get_user)):
  if payload:
    sql = f"UPDATE mini.`user` SET `del_yn` = 1 WHERE `no` = {payload["sub"]}"
    if save(sql):
      return {"status": True, "message": "사용자 탈퇴가 정상 처리가 되었습니다."}
  return {"status": False, "message": "사용자 탈퇴 중 오류가 발생 되었습니다."}
