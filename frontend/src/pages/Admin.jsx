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

  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [student, setStudent] = useState('')
  const [subject, setSubject] = useState('')

  // Leaderboard state
  const [degree, setDegree] = useState('all') // <-- "all" by default
  const [minPercent, setMinPercent] = useState(0)
  const [board, setBoard] = useState([])
  const [loadingBoard, setLoadingBoard] = useState(false)

  // If we already had a saved key, verify it once on mount
  useEffect(() => {
    if (!adminKey) return
    verifyKey(adminKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep axios default header in sync when authed
  useEffect(() => {
    if (isAuthed && adminKey) {
      api.defaults.headers.common['X-ADMIN-KEY'] = adminKey
    } else {
      delete api.defaults.headers.common['X-ADMIN-KEY']
    }
  }, [isAuthed, adminKey])

  async function verifyKey(key){
    setError('')
    try{
      await api.get('/admin/ping', { headers: { 'X-ADMIN-KEY': key } })
      sessionStorage.setItem('admin_key', key)
      setAdminKey(key)
      setIsAuthed(true)
      api.defaults.headers.common['X-ADMIN-KEY'] = key
      await load(1, student, subject, key)
    }catch(e){
      setIsAuthed(false)
      if (e?.response?.status === 429) {
        setError('Trop de tentatives. Réessaie dans une minute.')
      } else {
        setError('Clé admin invalide')
      }
    }
  }

  async function login(e){
    e?.preventDefault()
    const key = adminKeyInput.trim()
    if(!key) return setError('Saisis la clé administrateur')
    await verifyKey(key)
    setAdminKeyInput('')
  }

  function logout(){
    sessionStorage.removeItem('admin_key')
    setAdminKey('')
    setIsAuthed(false)
    setData({ data: [], current_page: 1, last_page: 1, total: 0 })
    setBoard([])
    delete api.defaults.headers.common['X-ADMIN-KEY']
  }

  async function load(p = page, s = student, subj = subject, key = adminKey){
    if(!key) return
    const { data } = await api.get('/results', {
      params: { page: p, per_page: 20, student: s, subject: subj },
      headers: { 'X-ADMIN-KEY': key }
    })
    setData({
      data: data.data || [],
      current_page: data.current_page || p,
      last_page: data.last_page || 1,
      total: data.total || (data.data?.length ?? 0)
    })
  }

  // reload when page changes
  useEffect(()=>{ if(isAuthed) load(page, student, subject) }, [page]) // eslint-disable-line

  const [deletingId, setDeletingId] = useState(null)
  async function deleteResult(id){
    const key = sessionStorage.getItem('admin_key') || ''
    if (!key) return alert('Clé admin manquante')
    if (!confirm('Supprimer ce résultat ? L’élève pourra repasser.')) return
    try{
      setDeletingId(id)
      await api.delete(`/results/${id}`, { headers: { 'X-ADMIN-KEY': key } })
      await load(page, student, subject, key)
    }catch(e){
      alert(e?.response?.data?.message || 'Échec de suppression')
    } finally {
      setDeletingId(null)
    }
  }

  // --- Bloc Sécurité admin ---
  function SecurityPanel() {
    const [oldKey, setOldKey] = useState(sessionStorage.getItem('admin_key') || '')
    const [newKey, setNewKey] = useState('')
    const [confirmKey, setConfirmKey] = useState('')
    const [saving, setSaving] = useState(false)

    async function rotate() {
      if (!oldKey) return alert('Ancienne clé manquante (reconnecte-toi).')
      if (!newKey || newKey.length < 16) return alert('La nouvelle clé doit faire au moins 16 caractères.')
      if (newKey !== confirmKey) return alert('La confirmation ne correspond pas.')
      try {
        setSaving(true)
        await api.post('/admin/admin-key',
          { new_key: newKey, confirm_key: confirmKey },
          { headers: { 'X-ADMIN-KEY': oldKey } }
        )
        sessionStorage.setItem('admin_key', newKey)
        api.defaults.headers.common['X-ADMIN-KEY'] = newKey
        setOldKey(newKey)
        setNewKey('')
        setConfirmKey('')
        alert('Clé admin mise à jour avec succès.')
      } catch (e) {
        if (e?.response?.status === 429) {
          alert('Trop de tentatives. Réessaie plus tard.')
        } else if (e?.response?.status === 401) {
          alert('Ancienne clé invalide.')
        } else {
          alert('Échec de la mise à jour de la clé.')
        }
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="p-4 rounded-xl bg-white shadow space-y-3">
        <h3 className="font-semibold">Sécurité admin</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="password"
            className="border rounded px-3 py-2"
            placeholder="Ancienne clé"
            value={oldKey}
            onChange={e=>setOldKey(e.target.value)}
          />
          <input
            type="password"
            className="border rounded px-3 py-2"
            placeholder="Nouvelle clé (≥16 caractères)"
            value={newKey}
            onChange={e=>setNewKey(e.target.value)}
          />
          <input
            type="password"
            className="border rounded px-3 py-2"
            placeholder="Confirmer la nouvelle clé"
            value={confirmKey}
            onChange={e=>setConfirmKey(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={rotate} disabled={saving} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">
            {saving ? 'En cours…' : 'Modifier la clé'}
          </button>
          <p className="text-xs text-gray-500">Astuce: utilise une phrase de passe longue (ex: 4+ mots aléatoires).</p>
        </div>
      </div>
    )
  }

  // ===== Leaderboard =====
  async function fetchLeaderboard() {
    try {
      setLoadingBoard(true)
      const adminKey = sessionStorage.getItem('admin_key') || ''
      const params = {
        degree: degree === 'all' ? undefined : degree,
        min_percent: minPercent || undefined,
        subject: subject || undefined
      }
      const { data } = await api.get('/admin/leaderboard', {
        params,
        headers: { 'X-ADMIN-KEY': adminKey },
      })
      setBoard(data.results || [])
    } catch (e) {
      alert('Échec du chargement du classement')
    } finally {
      setLoadingBoard(false)
    }
  }

  async function exportCSV() {
    try {
      const adminKey = sessionStorage.getItem('admin_key') || ''
      const params = {}
      if (degree !== 'all') params['degree'] = degree
      if (minPercent) params['min_percent'] = String(minPercent)
      if (subject) params['subject'] = subject

      const res = await api.get('/admin/leaderboard/export', {
        params,
        headers: { 'X-ADMIN-KEY': adminKey },
        responseType: 'blob'
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard_${degree === 'all' ? 'all' : degree}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Échec de l’export CSV')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold"><T>Admin – Résultats</T></h2>
        {isAuthed && (
          <div className="flex gap-2">
            <button
              onClick={() => nav('/admin/users')}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              <T>👥 Gérer les élèves</T>
            </button>
            <button
              onClick={() => nav('/admin/questions')}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
            >
              <T>➕ Créer une question</T>
            </button>
          </div>
        )}
      </div>

      {!isAuthed ? (
        <form onSubmit={login} className="bg-white rounded-2xl shadow p-6 max-w-md">
          <input
            className="w-full border rounded-lg px-3 py-2 mb-3"
            placeholder="Clé admin"
            value={adminKeyInput}
            onChange={e=>setAdminKeyInput(e.target.value)}
          />
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white">
            <T>Entrer</T>
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700"><T>Authentifié</T></span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-600 text-white hover:bg-white hover:text-red-500 rounded-lg border"
            >
              <T>Se déconnecter</T>
            </button>
          </div>

          {/* Filtres liste résultats */}
          <div className="bg-white rounded-2xl shadow p-4 grid md:grid-cols-4 gap-3">
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Rechercher un élève…"
              value={student}
              onChange={e=>setStudent(e.target.value)}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={subject}
              onChange={e=>setSubject(e.target.value)}
            >
              <option value=""><T>Toutes les matières</T></option>
              <option value="math"><T>Math</T></option>
              <option value="physics"><T>Physique</T></option>
              <option value="cs"><T>Informatique</T></option>
              <option value="language"><T>Langue</T></option>
              <option value="mixed"><T>Mixte</T></option>
            </select>
            <button
              onClick={()=>{
                setPage(1);
                setBoard([]); // reset classement when filters change
                load(1)
              }}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              <T>Filtrer</T>
            </button>
          </div>

          <SecurityPanel />

          {/* Tableau résultats */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3"><T>Élève</T></th>
                  <th className="text-left p-3"><T>Téléphone</T></th>
                  <th className="text-left p-3"><T>Matière</T></th>
                  <th className="text-left p-3"><T>Score</T></th>
                  <th className="text-left p-3"><T>Durée</T></th>
                  <th className="text-left p-3"><T>Date</T></th>
                  <th className="text-left p-3"><T>Actions</T></th>
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500"><T>Aucun résultat</T></td></tr>
                ) : data.data.map(r=>(
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.student_name}</td>
                    <td className="p-3">{r.phone || '-'}</td>
                    <td className="p-3">{r.subject || '-'}</td>
                    <td className="p-3">
                      {r.score}/{r.total} ({percent(r.score, r.total)}%)
                    </td>
                    <td className="p-3">{formatTime(r.duration)}</td>
                    <td className="p-3">{formatDate(r.created_at)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => deleteResult(r.id)}
                        disabled={deletingId === r.id}
                        className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                      >
                        <T>Supprimer</T>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              disabled={page<=1}
              onClick={()=>setPage(p=>Math.max(1, p-1))}
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
            >
              <T>Précédent</T>
            </button>
            <span className="text-sm text-gray-600">
              {data.current_page} / {data.last_page} • {data.total} <T>résultats</T>
            </span>
            <button
              disabled={page>=data.last_page}
              onClick={()=>setPage(p=>p+1)}
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
            >
              <T>Suivant</T>
            </button>
          </div>

          {/* Leaderboard (auth only) */}
          <div className="p-4 rounded-xl bg-white shadow space-y-3">
            <h3 className="font-semibold"><T>Classement par niveau</T></h3>
            <div className="flex flex-wrap gap-3">
              {/* Values match the backend alias map */}
              <select value={degree} onChange={e=>setDegree(e.target.value)} className="border rounded px-2 py-1">
                <option value="all">Tous les niveaux</option>
                <option value="first_degree">4eme</option>
                <option value="second_degree">5eme</option>
                <option value="third_degree">6eme</option>
                <option value="fourth_degree">Bac</option>
              </select>

              <input
                type="number"
                min={0}
                max={100}
                value={minPercent}
                onChange={e=>setMinPercent(Number(e.target.value))}
                placeholder="% minimum (optionnel)"
                className="border rounded px-2 py-1 w-40"
              />

              <input
                value={subject}
                onChange={e=>setSubject(e.target.value)}
                placeholder="Matière (optionnel)"
                className="border rounded px-2 py-1 w-48"
              />

              <button onClick={fetchLeaderboard} className="px-3 py-1 rounded bg-black text-white">
                {loadingBoard ? 'Chargement…' : 'Voir classement'}
              </button>
              <button onClick={exportCSV} className="px-3 py-1 rounded bg-emerald-600 text-white">
                Exporter CSV (Excel)
              </button>
              <button
                onClick={() => { setDegree('all'); setSubject(''); setMinPercent(0); setBoard([]); }}
                className="px-3 py-1 rounded border"
              >
                Réinitialiser filtres
              </button>
            </div>

            {board.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Rang</th>
                      <th className="py-2 pr-4">Nom</th>
                      <th className="py-2 pr-4">Téléphone</th>
                      <th className="py-2 pr-4">Score</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">%</th>
                      <th className="py-2 pr-4">Durée (s)</th>
                      <th className="py-2 pr-4">Matière</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map(r => (
                      <tr key={`${r.rank}-${r.phone}-${r.date}`} className="border-b">
                        <td className="py-2 pr-4">{r.rank}</td>
                        <td className="py-2 pr-4">{r.student_name}</td>
                        <td className="py-2 pr-4">{r.phone}</td>
                        <td className="py-2 pr-4">{r.score}</td>
                        <td className="py-2 pr-4">{r.total}</td>
                        <td className="py-2 pr-4">{r.percent}</td>
                        <td className="py-2 pr-4">{r.duration_s}</td>
                        <td className="py-2 pr-4">{r.subject || '-'}</td>
                        <td className="py-2 pr-4">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {board.length === 0 && !loadingBoard && (
              <p className="text-sm text-gray-500"><T>Aucun résultat pour ce niveau</T></p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function percent(score, total){
  if(!total) return 0
  const p = Math.round((Number(score) * 100) / Number(total))
  return isFinite(p) ? p : 0
}
function formatTime(s){
  const m = Math.floor(s/60).toString().padStart(2,'0')
  const ss = (s%60).toString().padStart(2,'0')
  return `${m}:${ss}`
}
function formatDate(iso){
  try{
    return new Date(iso).toLocaleString('fr-FR')
  }catch{
    return iso || '-'
  }
}
