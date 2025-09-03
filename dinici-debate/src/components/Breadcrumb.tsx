import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  path: string;
  label: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const location = useLocation();
  
  // 默认面包屑映射
  const defaultBreadcrumbs: Record<string, BreadcrumbItem[]> = {
    '/': [{ path: '/', label: '首页' }],
    '/debate': [
      { path: '/', label: '首页' },
      { path: '/debate', label: '开始辩论' }
    ],
    '/library': [
      { path: '/', label: '首页' },
      { path: '/library', label: '案例库' }
    ],
    '/profile': [
      { path: '/', label: '首页' },
      { path: '/profile', label: '用户中心' }
    ],
    '/settings': [
      { path: '/', label: '首页' },
      { path: '/settings', label: '设置' }
    ],
    '/overview': [
      { path: '/', label: '首页' },
      { path: '/overview', label: '帮助中心' }
    ]
  };
  
  const breadcrumbItems = items || defaultBreadcrumbs[location.pathname] || [
    { path: '/', label: '首页' }
  ];
  
  // 如果只有一个项目且是首页，不显示面包屑
  if (breadcrumbItems.length === 1 && breadcrumbItems[0].path === '/') {
    return null;
  }
  
  return (
    <nav style={{
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: '#666666',
      background: '#f8f9fa',
      borderBottom: '1px solid #e9ecef'
    }}>
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {index === breadcrumbItems.length - 1 ? (
            <span style={{ color: '#888888', fontWeight: '500' }}>{item.label}</span>
          ) : (
            <>
              <Link 
                to={item.path}
                style={{
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1a1a1a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#888888'}
              >
                {item.label}
              </Link>
              <span style={{ color: '#666666', fontSize: '0.75rem' }}>›</span>
            </>
          )}
        </div>
      ))}
    </nav>
  );
};