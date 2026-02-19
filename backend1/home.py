from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, EmailStr
from kafka import KafkaProducer
from settings import settings
from db import findOne, save, findAll, add_key
from auth import set_token
import json
import redis

class SignUpModel(BaseModel):
    name: str
    email: EmailStr
    gender: bool

class LoginModel(BaseModel):
    email: EmailStr

class CodeModel(BaseModel):
    id: str


kafka_server=settings.kafka_server
kafka_topic=settings.kafka_topic

pd = KafkaProducer(
  bootstrap_servers=kafka_server,
  value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

router = APIRouter(tags=["회원관리"])

@router.post("/check_email")
def check_email(email: EmailStr):
    sql = f"""
      SELECT COUNT(*) AS state
      FROM mini.`user`
      WHERE `del_yn` = '0' and `email`='{email}'
    """
    result = findOne(sql)

    if result:
        return {"status": result["state"] == 1}
        # True → 사용 가능
        # False → 이미 사용 중

    return {"status": False}

@router.post("/signup")
def signup(model: SignUpModel):

    # 1️⃣ 이메일 존재 여부 확인
    check_sql = f"""
        SELECT `no`, `del_yn`
        FROM mini.`user`
        WHERE `del_yn` = 0 AND `email` = '{model.email}'
        LIMIT 1
    """
    result = findOne(check_sql)

    # 2️⃣ 아예 없는 경우 → 신규 가입
    if not result:
        insert_sql = f"""
            INSERT INTO mini.`user`
            (`name`, `email`, `gender`, `reg_date`)
            VALUES (
                '{model.name}',
                '{model.email}',
                {model.gender},
                NOW()
            )
        """
        save(insert_sql)
        return {"status": True, "message": "회원가입 완료"}

    # 3️⃣ 활성 계정 존재 → 가입 불가
    if result["del_yn"] == 0:
        return {"status": False, "message": "이미 가입된 이메일입니다."}

    # 4️⃣ 탈퇴 계정 → 재가입 처리
    if result["del_yn"] == 1:
        update_sql = f"""
            UPDATE mini.`user`
            SET
                `name` = '{model.name}',
                `gender` = {model.gender},
                `del_yn` = 0,
                `mod_date` = NOW()
            WHERE `email` = '{model.email}'
        """
        save(update_sql)
        return {"status": True, "message": "재가입이 완료되었습니다."}


@router.post("/login")
def login(model: LoginModel):
    row = findOne(f"""
      SELECT `del_yn`
      FROM mini.`user`
      WHERE `email` = '{model.email}'
      LIMIT 1
    """)
    if not row:
        return {"status": False, "message": "존재하지 않는 계정입니다."}
    if str(row["del_yn"]) != "0":
        return {"status": False, "message": "비활성화된 계정입니다."}

    pd.send(settings.kafka_topic, dict(model))
    pd.flush()
    return {"status": True}

@router.post("/logout")
def logout(response: Response):
  response.delete_cookie(key="user")
  return {"status": True}

def checkCode(code: str):
  client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    db=0,
    decode_responses=True
  )
  result = client.get(code)
  if result:
    client.delete(code)
    return result
  return None

@router.post("/code")
def code(model: CodeModel, response : Response):
  print(model.id)
  result = checkCode(model.id)
  if result:
    id = set_token(result)
    if id:
      response.set_cookie(
      key="user",
      value=id,
      max_age=60 * 30,
      expires=60 * 30,
      # path="/",
      # domain="react",
      secure=False,
      httponly=True,
      samesite="lax",
    )
      return {"status": True}
  return {"status": False}
