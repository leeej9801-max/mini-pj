from fastapi import Cookie, Depends, APIRouter
from settings import settings
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from db import findOne, save
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

def get_user(user: str = Cookie(None)):
  if user:
    sql = f"select * from mini.`login` where `id` = '{user}'"
    result = findOne(sql)
    if result:
      return jwt.decode(result["token"], settings.secret_key, algorithms=settings.algorithm)
  return None

def get_info(user: str = Cookie(None)):
  if user:
    sql = f"""
    SELECT u.* 
    FROM mini.`user` AS u 
    INNER JOIN mini.`login` AS l
    ON (l.`id` = '{user}'
    AND u.no = l.user_no)
    WHERE u.del_yn = 0;
    """
    result = findOne(sql)
    if result:
      return result
  return None

def set_token(no: int):
  try:
    result = findOne(f"SELECT `no` FROM mini.user WHERE `email` = '{no}'")
    if result:
      iat = datetime.now(timezone.utc) + (timedelta(hours=7))
      exp = iat + (timedelta(minutes=settings.access_token_expire_minutes))
      data = {
        "iss": "EDU",
        "sub": str(result["no"]),
        "iat": iat,
        "exp": exp
      }
      id = uuid.uuid4().hex
      token = jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)
      sql = f"INSERT INTO mini.`login` (`id`, `user_no`, `token`) VALUE ('{id}', {result["no"]}, '{token}')"
      if save(sql): return id
  except JWTError as e:
    print(f"JWT ERROR : {e}")
  return None

@router.get("/me")
def me(payload = Depends(get_info)):
    if payload:
        return {"status": True, "new_name": payload['new_name']}
    return {"status": False}