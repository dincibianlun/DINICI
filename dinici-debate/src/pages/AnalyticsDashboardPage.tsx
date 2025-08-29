import { useState, useEffect } from 'react'
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
} from 'tdesign-react'
import { 
  UserIcon, 
  KeyIcon,
  TrendingUpIcon,
  DownloadIcon,
  ChatIcon
} from 'tdesign-icons-react'
import { 
  getPlatformStats, 
  getUserActivityRanking, 
  getTrendingCases,
  PlatformStats,
  UserActivity,
  TrendingCase
} from '../services/analyticsService'

const AnalyticsDashboardPage = () => {
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
  const [userRanking, setUserRanking] = useState<UserActivity[]>([])
  const [trendingCases, setTrendingCases] = useState<TrendingCase[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [timeRange, setTimeRange] = useState('30days')

  const timeRangeOptions = [
    { label: '最近7天', value: '7days' },
    { label: '最近30天', value: '30days' },
    { label: '最近90天', value: '90days' },
    { label: '自定义', value: 'custom' }
  ]

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stats, ranking, cases] = await Promise.all([
        getPlatformStats(dateRange),
        getUserActivityRanking(20),
        getTrendingCases(10)
      ])
      
      setPlatformStats(stats)
      setUserRanking(ranking)
      setTrendingCases(cases)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeRangeChange = (value: any) => {
    const selectedValue = value as string
    setTimeRange(selectedValue)
    const now = new Date()
    let startDate: Date

    switch (selectedValue) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        return
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    })
  }

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
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const latestStats = platformStats[0] || {}

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4">
      <header className="border-b border-cyan-400 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">数据看板</h1>
            <p className="text-sm text-purple-400">平台运营数据统计与分析</p>
          </div>
          <Space>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              options={timeRangeOptions}
              className="w-32 bg-gray-800 border-purple-500"
            />
            <Button 
              variant="outline" 
              icon={<DownloadIcon />}
              onClick={exportData}
              className="border-cyan-400 text-cyan-400"
            >
              导出数据
            </Button>
          </Space>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loading size="large" />
        </div>
      ) : (
        <>
          {/* 关键指标卡片 */}
          <Row gutter={16} className="mb-6">
            <Col xs={12} sm={6} lg={3}>
              <Card className="bg-gray-800 border-purple-500/30">
                <div className="flex items-center">
                  <UserIcon className="text-cyan-400 mr-2" />
                  <Statistic
                    title="总用户数"
                    value={latestStats.total_users || 0}
                    className="text-cyan-400"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="bg-gray-800 border-purple-500/30">
                <div className="flex items-center">
                  <TrendingUpIcon className="text-green-400 mr-2" />
                  <Statistic
                    title="活跃用户"
                    value={latestStats.active_users || 0}
                    className="text-green-400"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="bg-gray-800 border-purple-500/30">
                <div className="flex items-center">
                  <ChatIcon className="text-purple-400 mr-2" />
                  <Statistic
                    title="总辩论数"
                    value={latestStats.total_debates || 0}
                    className="text-purple-400"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6} lg={3}>
              <Card className="bg-gray-800 border-purple-500/30">
                <div className="flex items-center">
                  <KeyIcon className="text-orange-400 mr-2" />
                  <Statistic
                    title="活跃率"
                    value={latestStats.total_users ? parseFloat(((latestStats.active_users / latestStats.total_users) * 100).toFixed(1)) : 0}
                    suffix="%"
                    className="text-orange-400"
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户活跃度排名 */}
            <Card 
              title="用户活跃度排名" 
              className="bg-gray-800 border-purple-500/30"
              headerClassName="text-cyan-400 border-b border-purple-500/30"
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
                rowClassName="hover:bg-purple-900/30"
              />
            </Card>

            {/* 热门案例排行 */}
            <Card 
              title="热门案例排行" 
              className="bg-gray-800 border-purple-500/30"
              headerClassName="text-cyan-400 border-b border-purple-500/30"
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
                rowClassName="hover:bg-purple-900/30"
              />
            </Card>
          </div>

          {/* 平台数据趋势 */}
          <Card 
            title="平台数据趋势" 
            className="bg-gray-800 border-purple-500/30 mt-6"
            headerClassName="text-cyan-400 border-b border-purple-500/30"
          >
            <Table
              data={platformStats}
              columns={[
                { title: '日期', colKey: 'date', width: 120 },
                { title: '总用户', colKey: 'total_users', width: 100 },
                { title: '活跃用户', colKey: 'active_users', width: 100 },
                { title: '活跃率', colKey: 'active_rate', width: 100, cell: (row) => `${row.row.total_users ? ((row.row.active_users / row.row.total_users) * 100).toFixed(1) : 0}%` },
                { title: '总辩论', colKey: 'total_debates', width: 100 },
                { title: '总案例', colKey: 'total_cases', width: 100 },
                { title: '总浏览', colKey: 'total_views', width: 100 },
                { title: '总点赞', colKey: 'total_likes', width: 100 }
              ]}
              size="small"
              hover
              rowKey="date"
              rowClassName="hover:bg-purple-900/30"
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
  )
}

export default AnalyticsDashboardPage