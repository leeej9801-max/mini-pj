import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from '@/hooks/Authprovider.jsx';
import { api } from '@/utils/network.js';

const Login = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const sendMail = (e) => {
    e.preventDefault();
    api
      .post("login", { email })
      .then((res) => {
        if (res.data.status) {
          alert("메일 발송 요청 완료");
        } else alert("메일 발송 실패");
      })
      .catch((err) => {
        console.error(err);
        alert("오류");
      });
  };

  const verify = (e) => {
    e.preventDefault();
    api
      .post("/code", { id: code }, 
      { withCredentials: true })
      .then(async (res) => {
        if (res.data.status) {
          alert("인증 성공");
          await refreshAuth();     //여기서 즉시 로그인 상태 갱신
          navigate("/");           //새로고침 없이 nav가 바뀜
        } else {
          alert("인증 실패");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("오류");
      });
  };

  return (
    <div className="container mt-3 box_size">
      <h1 className="display-1 text-center">로그인</h1>

      <form onSubmit={sendMail}>
        <div className="mb-3 mt-3">
          <label htmlFor="email" className="form-label">이메일</label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="이메일를 입력하세요."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="d-flex mb-4">
          <div className="p-2 flex-fill d-grid">
            <button type="submit" className="btn btn-primary">메일 발송</button>
          </div>
          <div className="p-2 flex-fill d-grid">
            <button type="button" className="btn btn-primary" onClick={() => setEmail("")}>
              취소
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={verify}>
        <div className="mb-3 d-flex">
          <input
            type="text"
            className="form-control"
            id="code"
            placeholder="인증번호를 입력하세요"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" className="w-25 btn btn-primary">인증</button>
        </div>
      </form>
    </div>
  );
};

export default Login;