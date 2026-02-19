import { useState, useEffect } from 'react'
import { useNavigate } from "react-router";
import { useAuth } from '@hooks/AuthProvider.jsx'
import { api, formApi, BASE_URL } from '@utils/network.js'

const UserEdit = () => {

  const [no, setNo] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [gender, setGender] = useState(true)
  const [role, setRole] = useState(false)
  const [profileImg, setLocalProfileImg] = useState("") // 🔥 이름 변경

  const { checkAuth, setProfileImg } = useAuth() // 🔥 Context용
  const navigate = useNavigate()

  // ----------------------------
  // 이미지 업로드
  // ----------------------------
  const imgUpload = (file) => {
    const formData = new FormData();
    formData.append("files", file)
    formData.append("txt", "profile")
    return formApi.post("/upload", formData)
  }

  function imgEvent() {
    const x = document.createElement("input");
    x.type = "file";
    x.accept = "image/*";

    x.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        imgUpload(file)
          .then(res => {
            const newName = res.data.files[0];

            setLocalProfileImg(newName);  // 🔥 현재 페이지 갱신
            setProfileImg(newName);       // 🔥 Nav 자동 갱신 (Context)
          })
          .catch(err => console.error(err))
      }
    });

    x.click();
  }

  // ----------------------------
  // 수정 저장
  // ----------------------------
  const submitEvent = e => {
    e.preventDefault()
    const params = { email }

    api.patch("/user", params)
      .then(res => {
        alert(res.data.message)
        if (res.data.status) navigate("/userview")
      })
      .catch(err => console.error(err))
  }

  // ----------------------------
  // 초기 데이터 세팅
  // ----------------------------
  const setData = data => {
    setNo(data.no)
    setName(data.name)
    setEmail(data.email)
    setGender(data.gender === 1)
    setLocalProfileImg(data.new_name)
    setProfileImg(data.new_name) // 🔥 최초 로딩 시 전역 동기화
  }

  useEffect(() => {
    if (!checkAuth()) {
      navigate("/")
      return
    }

    api.post("/user")
      .then(res => {
        if (res.data.status) {
          setData(res.data.result)
          setRole(res.data.role)
        } else {
          alert(res.data.message);
          navigate("/");
        }
      })
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="container mt-3">
      <h1 className="display-1 text-center">회원수정</h1>

      <div className="d-flex justify-content-center">
        <img
          className="d-block rounded-circle img-thumbnail mt-3 border user_pt"
          src={
            profileImg
              ? `${BASE_URL}/uploads/${profileImg}`
              : "/img_01.jpg"
          }
          alt="logo"
          id="preview"
          onClick={imgEvent}
        />
      </div>

      <form onSubmit={submitEvent}>
        <div className="mb-3 mt-3">
          <label className="form-label">이름</label>
          <input type="text" className="form-control" readOnly value={name} />
        </div>

        <div className="mb-3 mt-3">
          <label className="form-label">이메일</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete='off'
            required
          />
        </div>

        <div className="d-flex">
          <div className="p-2 flex-fill">
            <div className="form-check">
              <input type="radio" checked={gender} onChange={() => setGender(true)} /> 남성
            </div>
          </div>
          <div className="p-2 flex-fill">
            <div className="form-check">
              <input type="radio" checked={!gender} onChange={() => setGender(false)} /> 여성
            </div>
          </div>
        </div>

        <div className="d-flex">
          {role &&
            <div className="p-2 flex-fill d-grid">
              <button type="submit" className="btn btn-primary">저장</button>
            </div>
          }
          <div className="p-2 flex-fill d-grid">
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/userview")}>
              취소
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default UserEdit
