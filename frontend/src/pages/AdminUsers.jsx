import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import T from '../components/T'

const DEGREES = [
  { key:'degree1', label:'Degree 1' },
  { key:'degree2', label:'Degree 2' },
  { key:'degree3', label:'Degree 3' },
  { key:'degree4', label:'Degree 4' },
]

export default function AdminUsers(){
  const nav = useNavigate()
  const adminKey = sessionStorage.getItem('admin_key') || ''

  // create form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [degree, setDegree] = useState('degree1')

  // list & filters
  const [q, setQ] = useState('')
  const [filterDegree, setFilterDegree] = useState('')
  const [page, setPage] = useState(1)
  const [list, setList] = useState({ data: [] })

  const headers = { 'X-ADMIN-KEY': adminKey }

  useEffect(() => {
    if (!adminKey) return nav('/admin')
    // verify key
    api.get('/admin/ping', { headers })
      .then(() => load(1))
      .catch(() => { sessionStorage.removeItem('admin_key'); nav('/admin') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(p = page) {
    const { data } = await api.get('/admin/users', {
      params: { page: p, per_page: 20, q, degree: filterDegree || undefined },
      headers,
    })
    setList(data)
  }

  async function addUser() {
    if (!name.trim() || !phone.trim()) return alert('Name & phone required')
    try {
      await api.post(
        '/admin/users',
        { name: name.trim(), phone: phone.trim(), degree },
        { headers }
      )
      setName(''); setPhone(''); setDegree('degree1')
      setPage(1); load(1)
      alert('Student saved ✅')
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save')
    }
  }

  async function delUser(id) {
    if (!confirm('Delete this student?')) return
    await api.delete(`/admin/users/${id}`, { headers })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => nav('/admin')}
          className="px-4 py-2 rounded-lg border bg-green-800 text-white hover:bg-gray-50 hover:text-black"
        >
          <T>← Back to Results</T>
        </button>
        <h2 className="text-2xl font-semibold"><T>Admin – Manage Students</T></h2>
        <div />
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Full name"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Phone (06… or +2126…)"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={degree}
            onChange={e=>setDegree(e.target.value)}
          >
            {DEGREES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <button onClick={addUser} className="px-4 py-2 rounded-lg bg-black text-white">
            <T>Add / Update</T>
          </button>
        </div>
        <p className="text-sm text-gray-500">
          <T>Phone must be Moroccan mobile (06/07… or +2126/7…).</T>
        </p>
      </div>

      {/* List + Filters */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="grid md:grid-cols-5 gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Search name or phone…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2"
            value={filterDegree}
            onChange={e=>setFilterDegree(e.target.value)}
          >
            <option value=""><T>All degrees</T></option>
            {DEGREES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
          <button onClick={()=>{ setPage(1); load(1) }} className="px-4 py-2 rounded-lg bg-black text-white">
            <T>Search</T>
          </button>
        </div>

        <table className="w-full text-sm mt-3">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3"><T>ID</T></th>
              <th className="text-left p-3"><T>Degree</T></th>
              <th className="text-left p-3"><T>Name</T></th>
              <th className="text-left p-3"><T>Phone</T></th>
              <th className="text-left p-3"><T>Role</T></th>
              <th className="text-left p-3"><T>Actions</T></th>
            </tr>
          </thead>
          <tbody>
            {list.data.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.id}</td>
                <td className="p-3">{u.degree}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <button onClick={()=>delUser(u.id)} className="px-3 py-2 rounded-lg border"><T>Delete</T></button>
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
            <T>Prev</T>
          </button>
          <button
            onClick={()=>{ const np = page+1; setPage(np); load(np) }}
            className="px-3 py-2 rounded-lg border"
          >
            <T>Next</T>
          </button>
        </div>
      </div>
    </div>
  )
}
