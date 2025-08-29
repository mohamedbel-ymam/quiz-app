import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import T from '../components/T'

export default function Home(){
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('') // NEW
  const nav = useNavigate()

  const start = async () => {
    if(!name.trim() || !phone.trim()) return alert('Name + phone required.')
    try{
      const { data } = await api.post('/quiz/start', {
        name: name.trim(),
        phone: phone.trim(),
        // subjects/per_subject optional
      })
      sessionStorage.setItem('student_name', name.trim())
      sessionStorage.setItem('student_degree', data.degree)
      sessionStorage.setItem('student_phone', data.phone || phone.trim()) // normalized if backend returned it
      sessionStorage.setItem('quiz_bundle', JSON.stringify(data.questions))
      nav('/quiz')
    } catch (e) {
  if (e?.response?.status === 409) {
    alert('Vous avez déjà passé le quiz.')
  } else if (e?.response?.status === 403) {
    alert('Numéro non autorisé.')
  } else if (e?.response?.status === 422) {
    alert('Numéro marocain invalide (06… ou +2126…).')
  } else {
    alert('Impossible de démarrer le quiz.')
  }
}
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold"><T>Start Quiz (15 min)</T></h2>
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Full name"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Phone (e.g. 06XXXXXXXX or +2126XXXXXXXX)"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
          />
          <button onClick={start} className="w-full bg-black text-white rounded-lg py-2">
            <T>Start</T>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8">
        <h3 className="text-xl font-semibold mb-3">Rules</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li><T>Authorized students only (by phone)</T></li>
          <li><T>15 min total, auto-next per question</T></li>
          <li><T>Results recorded for admin</T></li>
        </ul>
      </div>
    </div>
  )
}
