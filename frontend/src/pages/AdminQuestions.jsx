import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const SUBJECTS = [
  { key:'math', label:'Math' },
  { key:'physics', label:'Physics' },
  { key:'cs', label:'CS' },
  { key:'language', label:'Language' },
]

const DEGREES = [
  { key:'degree1', label:'Degree 1' },
  { key:'degree2', label:'Degree 2' },
  { key:'degree3', label:'Degree 3' },
  { key:'degree4', label:'Degree 4' },
]

export default function AdminQuestions(){
  const nav = useNavigate()
  const [adminKey] = useState(sessionStorage.getItem('admin_key') || '')

  // create form
  const [degree, setDegree]   = useState('degree1')
  const [subject, setSubject] = useState('math')
  const [text, setText]       = useState('')
  const [answers, setAnswers] = useState([
    { text:'', is_correct:true },
    { text:'', is_correct:false },
    { text:'', is_correct:false },
    { text:'', is_correct:false },
  ])

  // list & filters
  const [list, setList] = useState({ data: [] })
  const [page, setPage] = useState(1)
  const [filterSubj, setFilterSubj] = useState('')
  const [filterDegree, setFilterDegree] = useState('')

  const authedHeaders = { 'X-ADMIN-KEY': adminKey }

  const load = async (p = page) => {
    if (!adminKey) return
    const { data } = await api.get('/admin/questions', {
      params: {
        page: p,
        per_page: 20,
        subject: filterSubj || undefined,
        degree: filterDegree || undefined, // 👈 filter by degree
      },
      headers: authedHeaders,
    })
    setList(data)
  }

  useEffect(()=>{ load(1) }, []) // eslint-disable-line

  const setCorrect = (i)=>{
    setAnswers(prev => prev.map((a,idx)=> ({ ...a, is_correct: idx===i })))
  }

  const updateAnswer = (i, val)=>{
    setAnswers(prev => prev.map((a,idx)=> idx===i ? {...a, text: val} : a))
  }

  const addAnswer = ()=> setAnswers(prev => [...prev, {text:'', is_correct:false}])
  const removeAnswer = (i)=> setAnswers(prev => prev.length>2 ? prev.filter((_,idx)=>idx!==i) : prev)

  const create = async ()=>{
    if(!adminKey) return alert('Admin key missing')
    if(!text.trim()) return alert('Question text required')
    if(answers.some(a=>!a.text.trim())) return alert('All answers need text')
    try{
      await api.post('/admin/questions', {
        degree, subject, text, answers
      }, { headers: authedHeaders })

      setText('')
      setAnswers([
        { text:'', is_correct:true },
        { text:'', is_correct:false },
        { text:'', is_correct:false },
        { text:'', is_correct:false },
      ])
      // reload first page with current filters
      load(1)
      alert('Question created ✅')
    }catch(e){
      alert(e?.response?.data?.message || 'Failed to create question')
    }
  }

  const del = async (id)=>{
    if(!confirm('Delete this question?')) return
    await api.delete(`/admin/questions/${id}`, { headers: authedHeaders })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => nav('/admin')}
          className="px-4 py-2 rounded-lg border bg-green-800 text-white hover:bg-gray-50 hover:text-black"
        >
          ← Back to Results
        </button>
        <h2 className="text-2xl font-semibold">Admin – Create Questions</h2>
        <div />
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <select className="border rounded-lg px-3 py-2" value={degree} onChange={e=>setDegree(e.target.value)}>
            {DEGREES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2" value={subject} onChange={e=>setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={create} className="justify-self-end px-4 py-2 rounded-lg bg-black text-white">
            Create
          </button>
        </div>

        <textarea
          className="w-full border rounded-lg px-3 py-2"
          rows={3}
          placeholder="Question text…"
          value={text}
          onChange={e=>setText(e.target.value)}
        />

        <div className="space-y-2">
          {answers.map((a, i)=>(
            <div key={i} className="flex items-center gap-3">
              <input type="radio" checked={a.is_correct} onChange={()=>setCorrect(i)} />
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder={`Answer ${i+1}`}
                value={a.text}
                onChange={e=>updateAnswer(i, e.target.value)}
              />
              <button onClick={()=>removeAnswer(i)} className="px-3 py-2 rounded-lg border">Remove</button>
            </div>
          ))}
          <button onClick={addAnswer} className="px-3 py-2 rounded-lg border">Add answer</button>
        </div>
      </div>

      {/* List + Filters */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="grid md:grid-cols-5 gap-3">
          <select className="border rounded-lg px-3 py-2" value={filterDegree} onChange={e=>setFilterDegree(e.target.value)}>
            <option value="">All degrees</option>
            {DEGREES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>

          <select className="border rounded-lg px-3 py-2" value={filterSubj} onChange={e=>setFilterSubj(e.target.value)}>
            <option value="">All subjects</option>
            {SUBJECTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>

          <button onClick={()=>load(1)} className="px-4 py-2 rounded-lg bg-black text-white">Filter</button>
        </div>

        <table className="w-full text-sm mt-3">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Degree</th>
              <th className="text-left p-3">Subject</th>
              <th className="text-left p-3">Question</th>
              <th className="text-left p-3">Answers</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map(q=>(
              <tr key={q.id} className="border-t align-top">
                <td className="p-3">{q.id}</td>
                <td className="p-3">{q.degree}</td>
                <td className="p-3">{q.subject}</td>
                <td className="p-3">{q.text}</td>
                <td className="p-3">
                  <ul className="list-disc pl-5">
                    {q.answers.map(a=>(
                      <li key={a.id}>
                        {a.text} {a.is_correct ? <b>(correct)</b> : null}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3">
                  <button onClick={()=>del(q.id)} className="px-3 py-2 rounded-lg border">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-2 mt-3">
          <button
            disabled={page<=1}
            onClick={()=>{ const np = page-1; setPage(np); load(np) }}
            className="px-3 py-2 rounded-lg border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={()=>{ const np = page+1; setPage(np); load(np) }}
            className="px-3 py-2 rounded-lg border"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
