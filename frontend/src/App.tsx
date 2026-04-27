import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import DailySpeed from './pages/DailySpeed'
import History from './pages/History'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import { Guanyin } from './pages/Guanyin'
import Mall from './pages/Mall'
import Vip from './pages/Vip'

function App() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/daily-speed" element={<DailySpeed />} />
        <Route path="/guanyin" element={<Guanyin />} />
        <Route path="/mall" element={<Mall />} />
        <Route path="/vip" element={<Vip />} />
        <Route path="/history" element={<History />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tarot" element={<Navigate to="/" replace />} />
        <Route path="/bazi" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
