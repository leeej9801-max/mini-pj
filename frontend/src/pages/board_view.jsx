import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { api, BASE_URL } from '@utils/network.js'
import { useAuth } from '@/hooks/Authprovider.jsx';

// ✅ 날짜 포맷 함수
const format_date = (dateStr) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

const Board_view = () => {
    const [no, set_no] = useState(0);
    const [title, set_title] = useState("");
    const [content, set_content] = useState("");
    const [name, set_name] = useState("");
    const [reply, set_reply] = useState([]);
    const [new_reply, set_new_reply] = useState("");
    const [reg_date, set_reg_date] = useState(""); 
    const [role, set_role] = useState(false);
    
    // ✅ 수정 중인 댓글 관리
    const [edit_no, set_edit_no] = useState(null);
    const [edit_content, set_edit_content] = useState("");
    
    const { user } = useAuth();
    const params = useParams();
    const navigate = useNavigate();

    const del_event = () => {
        if (window.confirm("삭제하시겠습니까?")) {
            api.delete(`/board/${params.no}`) 
                .then(res => {
                    alert(res.data.message);
                    if (res.data.status) navigate("/");
                })
                .catch(err => console.error(err));
        }
    };

    const set_data = (data) => {
        set_no(data.no);
        set_title(data.title);
        set_content(data.content);
        set_name(data.name);
        set_reg_date(data.reg_date || data.regDate || ""); 
    };

    const load_reply = () => {
        api.post(`/board/${params.no}/comment`)
            .then(res => {
                if (res.data.status) set_reply(res.data.result)
            })
            .catch(err => console.error(err))
    }

    const getUrl = (new_name) => {
        if (new_name)
            return `${BASE_URL}/uploads/${new_name}`
        else
            return "/img_01.jpg"
    }

    useEffect(() => {
        api.get(`/board/${params.no}`)
            .then(res => {
                if (res.data.status) {
                    set_data(res.data.result);
                    set_role(res.data.role);
                } else {
                    alert(res.data.message);
                    navigate("/");
                }
            })
            .catch(err => console.error(err));
        load_reply();
    }, [params.no]);

    const reply_submit = () => {
        if (!new_reply.trim()) return alert("댓글 내용을 입력하세요.");
        api.post(`/board/${params.no}/comment/add`, { 
            content: new_reply, 
            board_no: Number(params.no)
        })
        .then(res => {
            if (res.data.status) {
                set_new_reply("");
                load_reply();
            } else {
                alert(res.data.message)
            }
        })
        .catch(err => console.error(err))
    };

    const reply_delete = (comment_no) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return
        api.delete(`/board/${params.no}/comment/${comment_no}`)
            .then(res => {
                alert(res.data.message)
                if (res.data.status) load_reply()
            })
            .catch(err => console.error(err))
    }

    // ✅ 수정 버튼 클릭 - 해당 댓글을 입력 모드로 전환
    const reply_edit_start = (c) => {
        set_edit_no(c.no)
        set_edit_content(c.content)
    }

    // ✅ 수정 취소
    const reply_edit_cancel = () => {
        set_edit_no(null)
        set_edit_content("")
    }

    // ✅ 수정 저장
    const reply_edit_submit = (comment_no) => {
        if (!edit_content.trim()) return alert("댓글 내용을 입력하세요.")
        api.patch(`/board/${params.no}/comment/${comment_no}`, {
            content: edit_content
        })
        .then(res => {
            if (res.data.status) {
                set_edit_no(null)
                set_edit_content("")
                load_reply()
            } else {
                alert(res.data.message)
            }
        })
        .catch(err => console.error(err))
    }

    return (
        <div className="container mt-3 mb-5">
            <h1 className="display-4 text-center">게시글</h1>
            <div className="card mb-4">
                <div className="card-body">
                    <h2 className="card-title">{title}</h2>
                    <p className="text-muted">작성자: {name}</p>
                </div>
            </div>

            <form>
                <div className="mb-3 mt-3">
                    <label className="form-label">제목</label>
                    <input type="text" className="form-control" readOnly value={title} />
                </div>
                <div className="mb-3 mt-3">
                    <label className="form-label">작성자</label>
                    <input type="text" className="form-control" readOnly value={name} />
                </div>
                <div className="mb-3 mt-3">
                    <label className="form-label">작성날짜</label>
                    <input type="text" className="form-control" readOnly value={format_date(reg_date)} />
                </div>
                <div className="mb-3 mt-3">
                    <label className="form-label">내용</label>
                    <textarea className="form-control" style={{ resize: "none" }} rows="10" readOnly value={content}></textarea>
                </div>
            </form>

            <div className="d-flex mb-4">
                {role && (
                    <>
                        <div className="p-2 flex-fill d-grid">
                            <button type="button" className="btn btn-primary" onClick={() => navigate(`/boardedit/${no}`)}>수정</button>
                        </div>
                        <div className="p-2 flex-fill d-grid">
                            <button type="button" className="btn btn-danger" onClick={del_event}>삭제</button>
                        </div>
                    </>
                )}
                <div className="p-2 flex-fill d-grid">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate("/")}>목록으로</button>
                </div>
            </div>

            <hr />
            <h4 className="mb-3">댓글</h4>

            <div className="input-group mb-5">
                <input 
                    type="text" 
                    className="form-control" 
                    value={new_reply}
                    onChange={(e) => set_new_reply(e.target.value)} 
                    placeholder="댓글을 입력하세요"
                    onKeyDown={(e) => e.key === "Enter" && reply_submit()}
                />
                <button type="button" className="btn btn-success" onClick={reply_submit}>등록</button>
            </div>

            <div className="mb-4">
                {reply && reply.map((c) => (
                    <div key={c.no} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                        <img 
                            src={getUrl(c?.new_name || "")}
                            alt="profile" 
                            className="rounded-circle me-3" 
                            style={{ width: "50px", height: "50px", objectFit: "cover" }} 
                        />
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                                <strong>{c.name}</strong>
                                {c.role && (
                                    <div>
                                        {/* ✅ 수정 중이 아닐 때만 수정/삭제 버튼 표시 */}
                                        {edit_no !== c.no && (
                                            <>
                                                <button 
                                                    className="btn btn-outline-secondary btn-sm me-1" 
                                                    style={{ fontSize: "12px" }}
                                                    onClick={() => reply_edit_start(c)}>
                                                    수정
                                                </button>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm" 
                                                    style={{ fontSize: "12px" }}
                                                    onClick={() => reply_delete(c.no)}>
                                                    삭제
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ✅ 수정 중이면 입력창, 아니면 댓글 내용 표시 */}
                            {edit_no === c.no ? (
                                <div className="d-flex mt-2">
                                    <input
                                        type="text"
                                        className="form-control me-2"
                                        value={edit_content}
                                        onChange={(e) => set_edit_content(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && reply_edit_submit(c.no)}
                                    />
                                    <button 
                                        className="btn btn-primary btn-sm me-1"
                                        onClick={() => reply_edit_submit(c.no)}>
                                        저장
                                    </button>
                                    <button 
                                        className="btn btn-secondary btn-sm"
                                        onClick={reply_edit_cancel}>
                                        취소
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-1">{c.content}</div>
                            )}

                            <div className="text-muted mt-1" style={{ fontSize: "13px" }}>
                                {format_date(c.reg_date)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 

export default Board_view;