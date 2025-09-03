import { useState, useEffect } from 'react';
import { 
  Card, 
  Statistic, 
  Table, 
  Button, 
  Loading,
  Space,
  Select,
  Row,
  Col
} from 'tdesign-react';
import { 
  UserOutlined, 
  KeyOutlined,
  LineChartOutlined,
  DownloadOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { 
  getPlatformStats, 
  getUserActivityRanking, 
  getTrendingCases,
  PlatformStats,
  UserActivity,
  TrendingCase
} from '../services/analyticsService';

const AnalyticsDashboardPage = () => {
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [userRanking, setUserRanking] = useState<UserActivity[]>([]);
  const [trendingCases, setTrendingCases] = useState<TrendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [timeRange, setTimeRange] = useState('30days');

  const timeRangeOptions = [
    { label: '最近7天', value: '7days' },
    { label: '最近30天', value: '30days' },
    { label: '最近90天', value: '90days' },
    { label: '自定义', value: 'custom' }
  ];

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stats, ranking, cases] = await Promise.all([
        getPlatformStats(dateRange),
        getUserActivityRanking(20),
        getTrendingCases(10)
      ]);
      
      setPlatformStats(stats);
      setUserRanking(ranking);
      setTrendingCases(cases);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (value: any) => {
    const selectedValue = value as string;
    setTimeRange(selectedValue);
    const now = new Date();
    let startDate: Date;

    switch (selectedValue) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    });
  };

  const exportData = () => {
    // 简单的CSV导出功能
    const csvContent = [
      ['日期', '总用户', '活跃用户', '总辩论', '总案例', '总浏览', '总点赞'],
      ...platformStats.map(stat => [
        stat.date,
        stat.total_users,
        stat.active_users,
        stat.total_debates,
        stat.total_cases,
        stat.total_views,
        stat.total_likes
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const latestStats = platformStats[0] || {};

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        padding: '2rem',
        position: 'relative'
      }}
    >
      {/* 简约网格背景 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      <header 
        style={{
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, color: '#00ffff', marginBottom: '0.5rem' }}>
              数据看板
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#888888' }}>平台运营数据统计与分析</p>
          </div>
          <Space>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              options={timeRangeOptions}
              style={{ width: '8rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.3)' }}
            />
            <Button 
              variant="outline" 
              icon={<DownloadOutlined style={{ fontSize: 14 }} />}
              onClick={exportData}
              style={{
                border: '1px solid #00ffff',
                color: '#00ffff',
                background: 'transparent'
              }}
            >
              导出数据
            </Button>
          </Space>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
          <Loading size="large" />
        </div>
      ) : (
        <>
          {/* 关键指标卡片 */}
          <Row gutter={16} style={{ marginBottom: '1.5rem' }}>
            {[
              { icon: <UserOutlined style={{ fontSize: 18 }} />, title: '总用户数', value: latestStats.total_users || 0, color: '#00ffff' },
              { icon: <LineChartOutlined style={{ fontSize: 18 }} />, title: '活跃用户', value: latestStats.active_users || 0, color: '#00ff88' },
              { icon: <MessageOutlined style={{ fontSize: 18 }} />, title: '总辩论数', value: latestStats.total_debates || 0, color: '#ff00ff' },
              { 
                icon: <KeyOutlined style={{ fontSize: 18 }} />, 
                title: '活跃率', 
                value: latestStats.total_users ? parseFloat(((latestStats.active_users / latestStats.total_users) * 100).toFixed(1)) : 0,
                suffix: '%',
                color: '#ffaa00' 
              }
            ].map((item, index) => (
              <Col xs={12} sm={6} lg={3} key={index}>
                <Card 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(0, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: item.color, marginRight: '0.5rem' }}>{item.icon}</span>
                    <Statistic
                      title={item.title}
                      value={item.value}
                      suffix={item.suffix}
                      style={{ color: item.color }}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {/* 用户活跃度排名 */}
            <Card 
              title="用户活跃度排名" 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(0, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
              headerStyle={{ color: '#00ffff', borderBottom: '1px solid rgba(0, 255, 255, 0.1)', padding: '1rem' }}
            >
              <Table
                data={userRanking}
                columns={[
                  { title: '排名', colKey: 'rank', width: 80 },
                  { title: '用户邮箱', colKey: 'email', ellipsis: true },
                  { title: '辩论数', colKey: 'total_debates', width: 100 },
                  { title: '浏览数', colKey: 'total_case_views', width: 100 },
                  { title: '点赞数', colKey: 'total_likes', width: 100 },
                  { title: '总得分', colKey: 'total_score', width: 100 }
                ]}
                size="small"
                hover
                rowKey="id"
              />
            </Card>

            {/* 热门案例排行 */}
            <Card 
              title="热门案例排行" 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(0, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
              headerStyle={{ color: '#00ffff', borderBottom: '1px solid rgba(0, 255, 255, 0.1)', padding: '1rem' }}
            >
              <Table
                data={trendingCases}
                columns={[
                  { title: '案例标题', colKey: 'topic', ellipsis: true },
                  { title: '浏览数', colKey: 'total_views', width: 100 },
                  { title: '点赞数', colKey: 'total_likes', width: 100 },
                  { title: '评论数', colKey: 'total_comments', width: 100 },
                  { title: '热度', colKey: 'popularity_score', width: 100 }
                ]}
                size="small"
                hover
                rowKey="id"
              />
            </Card>
          </div>

          {/* 平台数据趋势 */}
          <Card 
            title="平台数据趋势" 
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(0, 255, 255, 0.1)',
              borderRadius: '8px',
              marginTop: '1.5rem'
            }}
            headerStyle={{ color: '#00ffff', borderBottom: '1px solid rgba(0, 255, 255, 0.1)', padding: '1rem' }}
          >
            <Table
              data={platformStats}
              columns={[
                { title: '日期', colKey: 'date', width: 120 },
                { title: '总用户', colKey: 'total_users', width: 100 },
                { title: '活跃用户', colKey: 'active_users', width: 100 },
                { title: '活跃率', colKey: 'active_rate', width: 100, cell: (row: any) => `${row.row.total_users ? ((row.row.active_users / row.row.total_users) * 100).toFixed(1) : 0}%` },
                { title: '总辩论', colKey: 'total_debates', width: 100 },
                { title: '总案例', colKey: 'total_cases', width: 100 },
                { title: '总浏览', colKey: 'total_views', width: 100 },
                { title: '总点赞', colKey: 'total_likes', width: 100 }
              ]}
              size="small"
              hover
              rowKey="date"
              pagination={{
                defaultCurrent: 1,
                defaultPageSize: 10,
                total: platformStats.length
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboardPage;
