import { useState, useEffect } from 'react'
import { useNavigate } from "react-router";
import { useAuth } from '@hooks/AuthProvider.jsx'
import { api, BASE_URL } from '@utils/network.js'

const UserView = () =>{
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [regDate, setRegDate] = useState("");
	const [modDate, setModDate] = useState("");
	const [gender, setGender] = useState(true);
	const [profileImg, setProfileImg] = useState("")
	const { clearAuth, checkAuth } = useAuth()
	const navigate = useNavigate()

	const getUrl = () => {
	if (profileImg)
		return `${BASE_URL}/uploads/${profileImg}`
	else
		return "/img_01.jpg"
	}

   // deleteEvent 누를 때 사용자 탈퇴가 되도록 FastAPI에 요청 보내서 업데이트 되도록 함
	const deleteEvent = () => {   
    api.delete("/user")
    .then(res=>{
      alert(res.data.message)
      if(res.data.status) clearAuth()
    })
    .catch(err => console.error(err))

   // 로그인 시 name, email, gender, regDate, modDate, profile이 기본적으로 나오도록 data 설정
  }
  const setData = data => {
    setName(data.name)
    setEmail(data.email)
    setGender(data.gender === 1)
    setRegDate(data.regDate)
    setModDate(data.modDate)
	setProfileImg(data.new_name ?? "")
  }

  // 컴포넌트가 처음 화면에 나타날 떄 자동 실행되는 데 
  useEffect(()=>{
	// 로그인 ❌ 이면 홈(/)으로 강제 이동, 로그인 ⭕ 이면 아래 코드 계속 실행
    if(!checkAuth()) navigate("/")
	 // 백엔드 FastAPI /user 엔드포인트에 요청 보내서 현재 로그인한 유저 정보 달라고 요청
    api.post("/user")
	// 서버가 정상 응답 줬으면
    .then(res=>{
      if(res.data.status) {
	// 서버에서 받은 유저 정보를 React state에 저장
        setData(res.data.result)
        // setRole(res.data.role)
      } else {
		// 서버가 “인증 실패” or “유저 없음” 응답 주면 , 경고 띄우고 홈으로 튕김
        alert(res.data.message);
        navigate("/");
      }
    })
    .catch(err => console.error(err))
  }, [])
	return(
		<>
	
		<div className="container mt-3 position-relative">
		<h1 className="display-1 text-center">회원정보</h1>
			<div className="d-flex justify-content-center">
			<img
			src={getUrl()}
			className="d-block rounded-circle img-thumbnail mt-3 border user_pt"
			alt="프로필 이미지"
			style={{ width: "150px", height: "150px", objectFit: "cover" }}
			/> 
			</div>
		<form>
			<div>
				<div className="mb-3 mt-3">
					<label htmlFor="name" className="form-label">이름</label>
					<input type="text" className="form-control" id="name" name="name" readOnly="readonly" defaultValue={name}/>
				</div>
				<div className="mb-3 mt-3">
					<label htmlFor="email" className="form-label">이메일</label>
					<input type="email" className="form-control" id="email" name="email" readOnly="readonly" defaultValue={email}/>
				</div>
				<div className="mb-3 mt-3">
					<label htmlFor="regDate" className="form-label">가입일</label>
					<input type="text" className="form-control" id="regDate" name="regDate" readOnly="readonly" defaultValue={regDate}/>
				</div>
				<div className="mb-3 mt-3">
					<label htmlFor="modDate" className="form-label">회원정보 수정일</label>
					<input type="text" className="form-control" id="modDate" name="modDate" readOnly="readonly" defaultValue={modDate}/>
				</div>

				<div className="d-flex">
					<div className="p-2 flex-fill">
						<div className="form-check">
							<input type="radio" className="form-check-input" id="radio1" name="gender" value="1" checked={gender} disabled/>
							<label className="form-check-label" htmlFor="radio1">남성</label>
						</div>
					</div>
					<div className="p-2 flex-fill">
						<div className="form-check">
							<input type="radio" className="form-check-input" id="radio2" name="gender" value="2" checked={!gender} disabled/>여성
							<label className="form-check-label" htmlFor="radio2"></label>
						</div>
					</div>
				</div>
			</div>
		</form>
		<div className="d-flex">
			<div className="p-2 flex-fill d-grid">
				<button type="button" className="btn btn-primary" onClick={() => navigate("/")} >취소</button>
			</div>
			<div className="p-2 flex-fill d-grid">
				<button type="button" className="btn btn-primary" onClick={() => navigate("/useredit")}>수정</button>
			</div>
			<div className="p-2 flex-fill d-grid">
				<button type="button" className="btn btn-primary" onClick={deleteEvent}>탈퇴</button>
			</div>
		</div>
	</div>
		</>
	)
}
export default UserView;