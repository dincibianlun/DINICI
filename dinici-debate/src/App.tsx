import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import { EnhancedDebatePage } from './pages/EnhancedDebatePage';
import { CaseLibraryPage } from './pages/CaseLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { CaseOverviewPage } from './pages/CaseOverviewPage';
import { TTSSettingsPage } from './pages/TTSSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DebateManagementPage } from './pages/admin/DebateManagementPage';
import { ReviewManagementPage } from './pages/admin/ReviewManagementPage';
import { ArticleManagementPage } from './pages/admin/ArticleManagementPage';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './styles/admin-styles.css';
import './styles/input-fix.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/debate" element={<EnhancedDebatePage />} />
            
            {/* 案例库相关路由 - 允许游客访问 */}
            <Route path="/library" element={<CaseLibraryPage />} />
            <Route path="/library/:id" element={<CaseDetailPage />} />
            
            {/* 帮助中心（原总览页面）- 允许游客访问 */}
            <Route path="/overview" element={<CaseOverviewPage />} />
            
            {/* 文章详情页面 - 允许游客访问 */}
            <Route path="/article/:id" element={<ArticleDetailPage />} />
            
            {/* 用户中心 - 需要登录 */}
            <Route path="/profile" element={<PrivateRoute />}>
              <Route index element={<ProfilePage />} />
            </Route>
            
            {/* 设置页面 - 需要登录 */}
            <Route path="/settings" element={<PrivateRoute />}>
              <Route index element={<SettingsPage />} />
            </Route>
            
            {/* TTS设置 */}
            <Route path="/tts-settings" element={<PrivateRoute />}>
              <Route index element={<TTSSettingsPage />} />
            </Route>
            
            {/* 数据分析看板（仅管理员可访问） */}
            <Route path="/analytics" element={<AdminRoute><AnalyticsDashboardPage /></AdminRoute>} />
            
            {/* 管理后台路由 - 仅管理员可访问 */}
            <Route path="/hao" element={<AdminRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="debates" element={<DebateManagementPage />} />
              <Route path="reviews" element={<ReviewManagementPage />} />
              <Route path="articles" element={<ArticleManagementPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
