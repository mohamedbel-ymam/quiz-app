import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const QUIZ_DURATION = 15 * 60 // seconds

export default function Quiz(){
  const nav = useNavigate()
  const name  = sessionStorage.getItem('student_name') || ''
  const phone = sessionStorage.getItem('student_phone') || ''
  const bundle = JSON.parse(sessionStorage.getItem('quiz_bundle') || '[]')

  const [questions, setQuestions] = useState(bundle)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})       // qid -> answer_id
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)
  const [qTimeLeft, setQTimeLeft] = useState(0)
  const [timeSpent, setTimeSpent] = useState({})   // qid -> seconds
  const perQ = useRef(0)
  const degree = sessionStorage.getItem('student_degree') || ''


  const currentQ = questions[idx]

  useEffect(()=>{
    // ⬅️ was checking email; now we require name + phone + questions
    if(!name || !phone || questions.length === 0) return nav('/')
    const per = Math.max(5, Math.floor(QUIZ_DURATION / Math.max(questions.length,1)))
    perQ.current = per
    setQTimeLeft(per)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // global timer
  useEffect(()=>{
    const t = setInterval(()=> setTimeLeft(t => {
      if (t <= 1){ clearInterval(t); submit(true); return 0 }
      return t - 1
    }), 1000)
    return ()=> clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // per-question timer
  useEffect(()=>{
    if (!currentQ) return
    const qid = currentQ.id
    const t = setInterval(()=> {
      setQTimeLeft(prev => {
        if (prev <= 1){
          clearInterval(t)
          addSpent(qid, 1)
          goNext()
          return 0
        }
        addSpent(qid, 1)
        return prev - 1
      })
    }, 1000)
    return ()=> clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, currentQ?.id])

  const addSpent = (qid, sec=1)=>{
    setTimeSpent(prev => ({...prev, [qid]: (prev[qid] || 0) + sec}))
  }

  const select = (qid, aid)=> setAnswers(prev => ({...prev, [qid]: aid}))

  const goNext = ()=>{
    if (idx < questions.length - 1) {
      setIdx(i => i + 1)
      setQTimeLeft(perQ.current)
    } else {
      submit()
    }
  }
  const goPrev = ()=> {
    if (idx > 0) {
      setIdx(i => i - 1)
      setQTimeLeft(perQ.current)
    }
  }

  const submit = async (auto=false)=>{
    const payload = {
      student_name: name,
      student_phone: phone,
      subject: 'mixed', // compat backend
       degree,
      duration: QUIZ_DURATION - timeLeft,
      answers: questions.map(q => ({
        question_id: q.id,
        answer_id: Number(answers[q.id] || 0),
        time_spent: Number(timeSpent[q.id] || 0),
      })),
    }
    try{
      const { data } = await api.post('/submit', payload)
      sessionStorage.setItem('last_result', JSON.stringify({ subject:'mixed', ...data }))
      nav('/result')
    }catch(e){
      if (!auto) alert('Soumission impossible')
      else nav('/result')
    }
  }

  const pctGlobal = Math.round(((QUIZ_DURATION - timeLeft) / QUIZ_DURATION) * 100)
  const pctQ = currentQ ? Math.round(((perQ.current - qTimeLeft) / perQ.current) * 100) : 0

  if(!currentQ) return <p>Chargement…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <b>{name}</b> | {phone} | Degree: <b>{degree}</b> | Subject: <b>{currentQ.subject}</b>
        </div>
        <div className="text-sm">Global: <b>{format(timeLeft)}</b></div>
      </div>

      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-black" style={{width:`${pctGlobal}%`}}/>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-gray-800" style={{width:`${pctQ}%`}}/>
        </div>
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Question {idx+1}/{questions.length}</span>
          <span>Temps question: <b>{format(qTimeLeft)}</b></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="text-lg font-medium">Q{idx+1}. {currentQ.text}</div>
        <div className="grid gap-2">
          {currentQ.answers.map(a=>(
            <label key={a.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <input
                type="radio"
                name={`q-${currentQ.id}`}
                checked={answers[currentQ.id] === a.id}
                onChange={()=>select(currentQ.id, a.id)}
              />
              <span>{a.text}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <button onClick={goPrev} className="px-4 py-2 rounded-lg border hover:bg-gray-50" disabled={idx===0}>Précédent</button>
          <div className="flex gap-2">
            <button onClick={goNext} className="px-4 py-2 rounded-lg bg-black text-white">
              {idx === questions.length - 1 ? 'Soumettre' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function format(s){
  const m = Math.floor(s/60).toString().padStart(2,'0')
  const ss = (s%60).toString().padStart(2,'0')
  return `${m}:${ss}`
}
