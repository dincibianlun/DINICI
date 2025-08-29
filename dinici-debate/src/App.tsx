import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { DebatePage } from './pages/DebatePage';
import { CaseLibraryPage } from './pages/CaseLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CaseOverviewPage } from './pages/CaseOverviewPage';
import { TTSSettingsPage } from './pages/TTSSettingsPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/debate" element={<DebatePage />} />
          
          {/* 案例库相关路由 */}
          <Route path="/library" element={<PrivateRoute />}>
            <Route index element={<CaseLibraryPage />} />
            <Route path=":id" element={<CaseDetailPage />} />
          </Route>
          
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* 案例总览 */}
          <Route path="/overview" element={<PrivateRoute />}>
            <Route index element={<CaseOverviewPage />} />
          </Route>
          
          {/* TTS设置 */}
          <Route path="/tts-settings" element={<PrivateRoute />}>
            <Route index element={<TTSSettingsPage />} />
          </Route>
          
          {/* 数据分析看板（仅管理员可访问） */}
          <Route path="/analytics" element={<AdminRoute />}>
            <Route index element={<AnalyticsDashboardPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;