import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Loading, Tag, Divider, Typography, Message } from 'tdesign-react';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeftIcon } from 'tdesign-icons-react';
import { viewCase } from '../services/caseService';
import { useAuth } from '../context/AuthContext';

type DebateCaseDetail = {
  id: string;
  topic: string;
  positive_model: string;
  negative_model: string;
  positive_arguments: string[];
  negative_arguments: string[];
  created_at: string;
  tags?: string[];
  summary: string;
  views: number;
};

export const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseDetail, setCaseDetail] = useState<DebateCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchCaseDetail();
    
    // 记录案例浏览统计
    if (id) {
      viewCase(id, user?.id).catch(console.error);
    }
  }, [id, user?.id]);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCaseDetail(data as DebateCaseDetail);
    } catch (err) {
      console.error('Error fetching case detail:', err);
      Message.error('获取案例详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loading size="large" text="加载案例详情..." />
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <Typography.Title level="h3">案例不存在或已被删除</Typography.Title>
        <Button onClick={() => navigate('/case-library')} className="mt-4">
          <ArrowLeftIcon /> 返回案例库
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-purple-300 p-4 md:p-8">
      <Button
        variant="outline"
        onClick={() => navigate('/case-library')}
        className="mb-6 border-cyan-400 text-cyan-400"
      >
        <ArrowLeftIcon className="mr-2" /> 返回案例库
      </Button>

      <Card className="bg-gray-800 border-purple-500/30 shadow-[0_0_20px_rgba(128,0,128,0.3)]">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <Typography.Title level="h2" className="text-cyan-400 mb-4">{caseDetail.topic}</Typography.Title>

            <div className="flex flex-wrap gap-3 mb-6">
              <Tag theme="primary" className="bg-purple-900 border-purple-500 text-lg px-4 py-1">正方: {caseDetail.positive_model.split('/')[1]}</Tag>
              <Tag theme="danger" className="bg-pink-900 border-pink-500 text-lg px-4 py-1">反方: {caseDetail.negative_model.split('/')[1]}</Tag>
            </div>

            <Typography.Paragraph className="text-gray-300 text-lg mb-6 leading-relaxed">
              {caseDetail.summary}
            </Typography.Paragraph>

            <div className="mb-8">
              <Typography.Title level="h4" className="text-cyan-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                正方论点
              </Typography.Title>
              <div className="space-y-4 pl-4 border-l-2 border-purple-500/50">
                {caseDetail.positive_arguments.map((arg, index) => (
                  <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-purple-500/20">
                    <Typography.Paragraph className="text-gray-200">{arg}</Typography.Paragraph>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Typography.Title level="h4" className="text-pink-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                反方论点
              </Typography.Title>
              <div className="space-y-4 pl-4 border-l-2 border-pink-500/50">
                {caseDetail.negative_arguments.map((arg, index) => (
                  <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-pink-500/20">
                    <Typography.Paragraph className="text-gray-200">{arg}</Typography.Paragraph>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:w-1/3">
            <Card className="bg-gray-900 border-purple-500/50 h-full">
              <Typography.Title level="h3" className="text-purple-300 mb-4">案例信息</Typography.Title>

              <div className="space-y-4 text-gray-300">
                <div>
                  <Typography.Text className="text-gray-400 block mb-1">创建时间</Typography.Text>
                  <Typography.Text>{new Date(caseDetail.created_at).toLocaleString()}</Typography.Text>
                </div>

                <div>
                  <Typography.Text className="text-gray-400 block mb-1">浏览次数</Typography.Text>
                  <Typography.Text>{caseDetail.views}</Typography.Text>
                </div>

                <div>
                  <Typography.Text className="text-gray-400 block mb-1">标签</Typography.Text>
                  <div className="flex flex-wrap gap-2">
                    {caseDetail.tags?.map(tag => (
                      <Tag key={tag} variant="outline" className="border-purple-500/50 text-purple-300">{tag}</Tag>
                    )) || <Typography.Text>无标签</Typography.Text>}
                  </div>
                </div>
              </div>

              <Divider className="my-6 bg-purple-500/30" />

              <Space direction="vertical" size="large">
                <Button className="w-full bg-purple-900 hover:bg-purple-800 text-white border-purple-500">
                  复制辩论链接
                </Button>
                <Button className="w-full bg-cyan-900 hover:bg-cyan-800 text-white border-cyan-500">
                  基于此案例创建辩论
                </Button>
              </Space>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
};