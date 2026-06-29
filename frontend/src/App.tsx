import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RosterDetail from './pages/RosterDetail'
import ScheduleAdmin from './pages/ScheduleAdmin'
import AttendanceTracker from './pages/AttendanceTracker'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/rosters/:id" element={<RosterDetail />} />
      <Route path="/schedules/:id" element={<ScheduleAdmin />} />
      <Route path="/s/:id" element={<AttendanceTracker />} />
    </Routes>
  )
}
