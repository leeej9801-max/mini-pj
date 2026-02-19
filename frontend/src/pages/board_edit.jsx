import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { api } from '@/utils/network.js';
import {useAuth} from '@hooks/Authprovider.jsx'

const Board_edit = () =>{
    
        const [no, set_no] = useState(0)      
        const [title, set_title] = useState("")
        const [content, set_content] = useState("")
        const [name, set_name] = useState("")  //useState 를 이용해 이름,번호,내용이 새로고침을 하더라도 불러오도록 사용하는 것
       
        
        const params = useParams(); //글을 작성후 구분하기 위한 번호를 주기 위한 
        const navigate = useNavigate() //특정 페이지로 이동하기 위한 변수
        const { isLogin } = useAuth() //로그인 된 상태인지 쉽게 확인하기 위한 변수
        
        const submit_event = e =>{
          e.preventDefault()
          const edit_data = 
          { title : title,
            content : content }
          api.patch(`/board/${params.no}`,edit_data)  
             .then(res=>{
                alert(res.data.message)
                if(res.data.status) navigate(`/boardview/${params.no}`);
               })  
            .catch(err=>console.error(err))   //버튼을 눌렀을때 서버에 내용을 제출하고, params 로 글 번호를 부여 하고 작성 완료되면 부여받은 번호의 페이지로 이동한다
        
            }
    const set_data = data => {
        set_no(data.no)
        set_content(data.content)
        set_name(data.name)
        set_title(data.title)
    };
  
    useEffect(() => {
         api.get(`/board/${params.no}`)
            .then(res => {
                if (res.data.status) {
                    set_data(res.data.result);
                } else {
                    alert(res.data.message);
                    navigate("/");
                }
            })
            .catch(err => console.error(err));
    }, [params.no]); 

return (
        <div className="container mt-3">
            <h1 className="display-1 text-center">게시글 수정</h1>
            <form onSubmit={submit_event}>
                <div className="mb-3 mt-3">
                    <label htmlFor="title" className="form-label">제목</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="title" 
                        value={title} 
                        onChange={(e) => set_title(e.target.value)} 
                    />
                </div>
                <div className="mb-3 mt-3">
                    <label htmlFor="name" className="form-label">작성자</label>
                    <input type="text" className="form-control" id="name" value={name} disabled />
                </div>
                <div className="mb-3 mt-3">
                    <label htmlFor="content" className="form-label">내용</label>
                    <textarea 
                        className="form-control h-50" 
                        rows="10" 
                        value={content} 
                        onChange={(e) => set_content(e.target.value)}
                    ></textarea>
                </div>
                <div className="d-flex">
                    <div className="p-2 flex-fill d-grid">
                        <button type="submit" className="btn btn-primary">저장</button>
                    </div>
                    <div className="p-2 flex-fill d-grid">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(`/boardview/${no}`)}>취소</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Board_edit;