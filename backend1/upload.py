from fastapi import APIRouter, File, UploadFile, Form, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List
import shutil
import uuid
from db import findOne, findAll, save, add_key
from auth import get_user


class FileModel(BaseModel):
  txt: str
  files: List[str]

UPLOAD_DIR = Path("uploads") ## 이미지 실제 저장할 서버 폴더 (./uploads)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"} ## 허용할 이미지 확장자 목록 (보안 목적)
MAX_FILE_SIZE = 10 * 1024 ## 최대 업로드 용량 (현재 10KB — 너무 작음 ⚠ 보통 5~10MB로 설정)
FILE_CONTENT_TYPE = "image/png"

router = APIRouter(prefix="/upload", tags=["이미지업로드"]) ## /upload로 시작하는 API들을 묶는 라우터


def checkDir(): ## uploads 폴더 없으면 생성, 서버 터지는 거 방지용 안전장치
  UPLOAD_DIR.mkdir(exist_ok=True)


def saveFile(file, user_no):
    checkDir()
    origin = file.filename
    ext = file.filename.split(".")[-1].lower()
    new_name = f"{uuid.uuid4().hex}.{ext}"

    path = UPLOAD_DIR / new_name
    with path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    sql = f"""
        UPDATE mini.`user`
        SET origin = '{origin}',
            ext = '{ext}',
            new_name = '{new_name}',
            mod_date = NOW() 
        WHERE no = {user_no}
    """
    save(sql)
    return new_name


@router.post("")
def upload(
    files: List[UploadFile] = File(...),
    txt: str = Form(...),
    payload = Depends(get_user)
):
    print("payload:", payload)   # ← 추가

    if not payload:
        return {"status": False, "message": "인증 실패"}
    saved = []

    for file in files:
        saved.append(saveFile(file, payload["sub"]))

    return {
        "status": True,
        "files": saved,
        "type": txt
    }

@router.get("/images") ## 업로드된 이미지 DB 목록 조회
def images():
    sql = "select * from mini.`user` order by no desc" ## 최신 이미지부터 불러오기
    return {"status": True, "result": findAll(sql)} ## 전체 이미지 리스트 반환

@router.get("/download")
def download(id : str):
  sql = f"""
    select `origin`, `new_name` from mini.`user` where `no` = {id}
  """
  result= findOne(sql)
  if result:
    print(result)
    origin = result["origin"]
    new_name = result["new_name"]
    path = UPLOAD_DIR/ new_name
    return FileResponse(path=path, filename=origin ) # filename=origin 붙기 전에는 뷰어 // 붙이면 다운로드 제공
  return {"status": False}  
