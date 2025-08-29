import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthPage } from './pages/AuthPage'
import { DebatePage } from './pages/DebatePage'
import { CaseLibraryPage } from './pages/CaseLibraryPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/debate" element={<DebatePage />} />
        <Route path="/library" element={<CaseLibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  )
}

export default App
