import { Link } from "react-router";
import { useAuth } from "@hooks/AuthProvider.jsx";
import { BASE_URL } from "@utils/network.js";

const Nav = () => {
  const { isLogin, removeAuth, profileImg } = useAuth();


  const imageUrl = profileImg
    ? `${BASE_URL}/uploads/${profileImg}?t=${Date.now()}`
    : "/img_01.jpg";

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Team1</Link>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {!isLogin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">로그인</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">회원가입</Link>
                </li>
              </>
            )}

            {isLogin && (
              <>
                <li className="nav-item">
                  <button className="nav-link" type="button" onClick={removeAuth}>
                    로그아웃
                  </button>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/userview">회원정보</Link>
                </li>
              </>
            )}
          </ul>

          <img
            src={imageUrl}
            className="border user_pt_nav mt-1 object-fit-cover rounded-circle"
            style={{ width: "40px", height: "40px" }}
            alt="profile"
          />
        </div>
      </div>
    </nav>
  );
};

export default Nav;
