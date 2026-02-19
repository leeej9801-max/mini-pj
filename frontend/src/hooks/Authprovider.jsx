import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "@utils/network.js";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [profileImg, setProfileImg] = useState("")
  const navigate = useNavigate();

  // 🔥 사용자 정보 + 프로필 이미지 가져오기
  const fetchUser = async () => {
    try {
      const res = await api.post("/user");
      if (res.data?.status) {
        setIsLogin(true);
        setProfileImg(res.data.result?.new_name ?? "");
      } else {
        setIsLogin(false);
        setProfileImg("");
      }
    } catch (e) {
      setIsLogin(false);
      setProfileImg("");
    }
  };

  const refreshAuth = async () => {
    try {
      const res = await api.get("/auth/me"); 
      setIsLogin(!!res.data?.status);
    } catch (e) {
      setIsLogin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);


  const setAuth = async () => {
    setLoading(true);
    await refreshAuth(); 
    navigate("/");
  };

  const clearAuth = () => {
    setIsLogin(false);
    setProfileImg("");   // 🔥 로그아웃 시 초기화
    navigate("/");
  };

  const removeAuth = () => {
    api.post("/logout")
      .then((res) => {
        if (res.data?.status) clearAuth();
      })
      .catch((err) => console.error(err));
  };

  const checkAuth = () => isLogin;

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ isLogin, profileImg, setAuth, setProfileImg, removeAuth, clearAuth, checkAuth, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;