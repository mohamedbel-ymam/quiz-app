import { Outlet, Link } from 'react-router-dom'
import Logo from './Logo'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Etablissement Takwa</h1>
          <Logo/>
          <nav className="flex gap-4 text-sm">
            <Link className="hover:underline" to="/">Accueil</Link>
            <Link className="hover:underline" to="/admin">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Test Takwa
      </footer>
    </div>
  )
}
