import { Link } from 'react-router-dom'

export default function Result(){
  const data = JSON.parse(sessionStorage.getItem('last_result') || '{}')
  if(!data.result_id) return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p>Aucun résultat trouvé.</p>
      <Link className="text-blue-600 underline" to="/">Retour</Link>
    </div>
  )

  const per = data.percent ?? Math.round((data.score*100)/(data.total||1))

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Résultat</h2>
      <p>Matière : <b>{data.subject}</b></p>
      <div className="flex items-center justify-between">
        <div>Score : <b>{data.score}/{data.total}</b> ({per}%)</div>
        <div>Durée : <b>{formatTime(data.details?.total_seconds || 0)}</b></div>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-2 bg-black" style={{width:`${per}%`}}/>
      </div>
      <Link className="inline-block mt-2 px-4 py-2 rounded-lg border hover:bg-gray-50" to="/">Terminé</Link>
    </div>
  )
}

function formatTime(s){
  const m = Math.floor(s/60).toString().padStart(2,'0')
  const ss = (s%60).toString().padStart(2,'0')
  return `${m}:${ss}`
}
