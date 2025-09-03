import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Loading
} from 'tdesign-react'

import { Header } from '../components/Header'
import { Breadcrumb } from '../components/Breadcrumb'
import { useArticleStore, Article } from '../store/articleStore'

type ArticleCategory = {
  label: string
  value: string
  count: number
}

export const CaseOverviewPage = () => {
  useEffect(() => {
    // 页面加载时自动跳转到飞书文档页面，并在新窗口打开
    window.open('https://lcnad7wrmp5x.feishu.cn/wiki/KCGBw9I7BiIryokq1KbcLvTInIc?from=from_copylink', '_blank');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#333333', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 600, 
          color: '#1a1a1a', 
          marginBottom: '1rem'
        }}>
          正在跳转到帮助中心...
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: '#666666', 
          lineHeight: 1.6,
          marginBottom: '1.5rem'
        }}>
          如果没有自动跳转，请点击下方按钮访问帮助中心
        </p>
        <button
          onClick={() => window.open('https://lcnad7wrmp5x.feishu.cn/wiki/KCGBw9I7BiIryokq1KbcLvTInIc?from=from_copylink', '_blank')}
          style={{
            background: '#1a1a1a',
            border: 'none',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '1rem'
          }}
        >
          访问帮助中心
        </button>
      </div>
    </div>
  )
}
