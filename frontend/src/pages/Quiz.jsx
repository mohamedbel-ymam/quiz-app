import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import T from '../components/T'

const QUIZ_DURATION = 15 * 60 // seconds

export default function Quiz(){
  const nav = useNavigate()
  const name  = sessionStorage.getItem('student_name') || ''
  const phone = sessionStorage.getItem('student_phone') || ''
  const degree = sessionStorage.getItem('student_degree') || ''
  const bundle = JSON.parse(sessionStorage.getItem('quiz_bundle') || '[]')

  const [questions, setQuestions] = useState(bundle)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})       // qid -> answer_id (undefined means unanswered)
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)

  const ticking = useRef(false)

  useEffect(() => {
    if (!Array.isArray(bundle) || bundle.length === 0) {
      // if no bundle (refresh, backdoor), send home
      nav('/', { replace: true })
      return
    }
    setQuestions(bundle)
  }, [])

  // Global timer
  useEffect(() => {
    if (ticking.current) return
    ticking.current = true
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t)
          handleSubmit() // global timeout -> submit whatever we have
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // 🚫 Prevent going back with browser back
  useEffect(() => {
    const block = () => {
      history.pushState(null, document.title, window.location.href)
    }
    history.pushState(null, document.title, window.location.href)
    window.addEventListener('popstate', block)
    return () => window.removeEventListener('popstate', block)
  }, [])

  // ⏭️ Move forward only
  const goNext = () => {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1) // can only increment
    } else {
      handleSubmit()
    }
  }

  const choose = (qid, answerId) => {
    setAnswers(prev => ({ ...prev, [qid]: answerId }))
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        student_name: name,
        student_phone: phone,
        degree,
        // Optionally include a global subject label or keep per-question subject server-side
        subject: questions[0]?.subject ?? null,
        answers: Object.entries(answers).map(([qid, ansId]) => ({
          question_id: Number(qid),
          answer_id: ansId ?? null
        })),
        total: questions.length,        // help server compute percent reliably
        duration: QUIZ_DURATION - timeLeft
      }
      const { data } = await api.post('/submit', payload)
      sessionStorage.setItem('last_result', JSON.stringify(data))
      // clear bundle to prevent re-entry
      sessionStorage.removeItem('quiz_bundle')
      nav('/result', { replace: true })
    } catch (e) {
      if (e?.response?.status === 409) {
        alert('You already took the quiz.')
        nav('/', { replace: true })
        return
      }
      alert('Submit failed. Please contact the admin.')
    }
  }

  if (!questions.length) return null
  const currentQ = questions[idx]
  const answered = answers[currentQ.id] // may be undefined (empty allowed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <b>{name}</b> | {phone} | <T>Degree:</T> <b>{degree}</b> | <T>Subject:</T> <b>{currentQ.subject}</b>
        </div>
        <div className="text-sm"><T>Time left:</T> <b>{format(timeLeft)}</b></div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="mb-4 text-lg font-medium">
          {idx + 1}. {currentQ.text}
        </div>

        <div className="space-y-2">
          {currentQ.answers.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`q_${currentQ.id}`}
                checked={answered === opt.id}
                onChange={() => choose(currentQ.id, opt.id)}
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>

        {/* Controls (no Previous button!) */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Question {idx + 1} / {questions.length}
          </div>
          <button
            onClick={goNext}
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            {idx === questions.length - 1 ? 'Submit' : 'Next'}
          </button>
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
