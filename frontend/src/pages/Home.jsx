import { useState, useEffect } from 'react'
import { api } from '@utils/network.js'
import { useNavigate } from "react-router";
import { useAuth } from '@hooks/AuthProvider.jsx'

const Pagination = ({ total, page, pagingEvent }) => {
  return (
    <nav aria-label="Page navigation example">
      { total > 0 &&
      <ul className="pagination justify-content-center mt-4">
        <li className="page-item">
          <button className="page-link" aria-label="Previous" onClick={()=>pagingEvent(page - 1)} disabled={page === 1}>
            <span aria-hidden="true">&laquo;</span>
          </button>
        </li>
        {
          Array.from( { length: total } )?.map((_,i) => {
            const index = (i + 1)
            return (
              <li className="page-item cursor-pointer" key={i}>
                <button className={page === index ? "page-link active" : "page-link"} onClick={()=>pagingEvent(index)} disabled={page === index}>{index}</button>
              </li>
            )
          })
        }
        <li className="page-item">
          <button className="page-link" aria-label="Next" onClick={()=>pagingEvent(page + 1)} disabled={page === total}>
            <span aria-hidden="true">&raquo;</span>
          </button>
        </li>
      </ul>
      }
    </nav>
  )
}

const Home = () => {
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const searchEvent = e => {
    e.preventDefault()
    getData(1, search)
    setPage(1)
    // setSearch("")
  }
  const pagingEvent = index => {
    setPage(index)
    getData(index, search)
  }
  const boardAdd = () => {
    if(checkAuth()) navigate('/board_add')
  }
  const boardView = no => navigate(`/board_view/${no}`)
  
  const getData = (i, q) => {
    const params = {
      "page": i - 1,
      "search": q
    }
    api.post("/board", params)
    .then(res => {
      if(res?.data?.status) {
        setList(res?.data?.result)
        setTotal(res?.data?.pagination?.total)
      }else {
        setList([])
        setTotal(0)
        setPage(1)
      }
    })
    .catch(err => console.error(err))
  }
  useEffect(() => {
    getData(page, search)
  }, [])
  return (
    <div className="container mt-3">
			<h1 className="display-1 text-center">게시판</h1>
			<div className="d-flex justify-content-between align-items-center mt-4">
				<div className="btn-group">
					<button type='button' className="btn btn-primary" onClick={boardAdd}>게시글 작성</button>
				</div>
				<form className="d-flex" style={{"maxWidth" : "300px"}} onSubmit={searchEvent}>
					<input className="form-control me-2" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="검색어를 입력하세요" />
					<button className="btn btn-outline-dark" type="submit">Search</button>
				</form>
			</div>
			<table className="table table-hover mt-3 text-center">
				<thead className="table-dark">
					<tr>
						<th>no</th>
						<th>게시글</th>
						<th>작성자</th>
					</tr>
				</thead>
				<tbody>
          {
            list?.map((v, i) => {
              return (
                <tr className="cursor-pointer" key={i} onClick={()=>boardView(v.no)}>
                  <td>{v.no}</td>
                  <td>{v.title}</td>
                  <td>{v.name}</td>
                </tr>
              )
            })
          }
				</tbody>
			</table>
      <Pagination total={total} page={page} pagingEvent={pagingEvent} />
		</div>
  )
}

export default Home