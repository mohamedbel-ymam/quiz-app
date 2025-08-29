import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import T from '../components/T'

export default function Admin(){
  const nav = useNavigate()
  const [adminKeyInput, setAdminKeyInput] = useState('')
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem('admin_key') || '')
  const [isAuthed, setIsAuthed] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ data: [] })
  const [page, setPage] = useState(1)
  const [student, setStudent] = useState('')
  const [subject, setSubject] = useState('')

  // If we already had a saved key, verify it once on mount
  useEffect(() => {
    if (!adminKey) return
    verifyKey(adminKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verifyKey(key){
    setError('')
    try{
      // lightweight ping on a protected route
      await api.get('/admin/ping', { headers: { 'X-ADMIN-KEY': key } })
      sessionStorage.setItem('admin_key', key)
      setAdminKey(key)
      setIsAuthed(true)
      // preload table
      await load(1, student, subject, key)
    }catch(e){
      setIsAuthed(false)
      setError('Invalid admin key')
    }
  }

  async function login(e){
    e?.preventDefault()
    const key = adminKeyInput.trim()
    if(!key) return setError('Enter admin key')
    await verifyKey(key)
    setAdminKeyInput('')
  }

  function logout(){
    sessionStorage.removeItem('admin_key')
    setAdminKey('')
    setIsAuthed(false)
    setData({ data: [] })
  }

  async function load(p = page, s = student, subj = subject, key = adminKey){
    if(!key) return
    const { data } = await api.get('/results', {
      params: { page: p, per_page: 20, student: s, subject: subj },
      headers: { 'X-ADMIN-KEY': key }
    })
    setData(data)
  }

  // reload when page changes
  useEffect(()=>{ if(isAuthed) load(page, student, subject) }, [page]) // eslint-disable-line

  async function deleteResult(id){
    const key = sessionStorage.getItem('admin_key') || ''
    if (!key) return alert('Admin key missing')
    if (!confirm('Delete this result? The student will be able to retake.')) return
    try{
      await api.delete(`/results/${id}`, { headers: { 'X-ADMIN-KEY': key } })
      await load(page, student, subject, key) // re-fetch current page with current filters
    }catch(e){
      alert(e?.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold"><T>Admin – Results</T></h2>
        {isAuthed && (
          <div className="flex gap-2">
            <button
              onClick={() => nav('/admin/users')}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <T>👥 Manage Students</T>
            </button>
            <button
              onClick={() => nav('/admin/questions')}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
            >
              <T>➕ Create Question</T>            </button>
          </div>
        )}
      </div>

      {!isAuthed ? (
        <form onSubmit={login} className="bg-white rounded-2xl shadow p-6 max-w-md">
          <input
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="Admin key"
            value={adminKeyInput}
            onChange={e=>setAdminKeyInput(e.target.value)}
          />
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white"><T>Enter</T></button>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700"><T>Authenticated</T></span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-600 text-white hover:bg-white hover:text-red-500 rounded-lg border"
            >
              <T>Logout</T>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 grid md:grid-cols-4 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Search student…"
              value={student}
              onChange={e=>setStudent(e.target.value)}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={subject}
              onChange={e=>setSubject(e.target.value)}
            >
              <option value=""><T>All subjects</T></option>
              <option value="math"><T>Math</T></option>
              <option value="physics"><T>Physics</T></option>
              <option value="cs"><T>CS</T></option>
              <option value="language"><T>Language</T></option>
              <option value="mixed"><T>Mixed</T></option>
            </select>
            <button onClick={()=>{ setPage(1); load(1) }} className="px-4 py-2 rounded-lg bg-black text-white">
              <T>Filter</T>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3"><T>Student</T></th>
                  <th className="text-left p-3"><T>Subject</T></th>
                  <th className="text-left p-3"><T>Score</T></th>
                  <th className="text-left p-3"><T>Duration</T></th>
                  <th className="text-left p-3"><T>Date</T></th>
                  <th className="text-left p-3"><T>Actions</T></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(r=>(
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.student_name}</td>
                    <td className="p-3">{r.subject}</td>
                    <td className="p-3">
                      {r.score}/{r.total} ({Math.round((r.score*100)/(r.total||1))}%)
                    </td>
                    <td className="p-3">{formatTime(r.duration)}</td>
                    <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteResult(r.id)}
                        className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                      ><T> Delete</T>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page<=1}
              onClick={()=>setPage(p=>p-1)}
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
            >
              <T>Prev</T>
            </button>
            <button
              onClick={()=>setPage(p=>p+1)}
              className="px-3 py-2 rounded-lg border"
            >
              <T>Next</T>
              
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function formatTime(s){
  const m = Math.floor(s/60).toString().padStart(2,'0')
  const ss = (s%60).toString().padStart(2,'0')
  return `${m}:${ss}`
}
