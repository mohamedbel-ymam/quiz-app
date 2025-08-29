import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Quiz from './pages/Quiz.jsx'
import Result from './pages/Result.jsx'
import Admin from './pages/Admin.jsx'
import AdminQuestions from './pages/AdminQuestions.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import './i18n.js';
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Home /> },
    { path: 'quiz', element: <Quiz /> },
    { path: 'result', element: <Result /> },
    { path: 'admin', element: <Admin /> },
    { path: 'admin/questions', element: <AdminQuestions /> },
    { path: 'admin/users', element: <AdminUsers /> },

  ]},
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)

