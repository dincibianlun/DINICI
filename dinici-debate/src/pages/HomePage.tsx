import { useState, useEffect } from 'react';
import { Button } from 'tdesign-react';
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
  const navigate = useNavigate();
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  
  const texts = [
    'AI驱动的智能辩论',
    '探索思维的边界',
    '让观点碰撞出火花',
    '体验未来辩论方式'
  ];

  // 简化的打字机效果
  useEffect(() => {
    const text = texts[textIndex];
    let charIndex = 0;
    let typeInterval: NodeJS.Timeout;
    
    const startTyping = () => {
      typeInterval = setInterval(() => {
        if (charIndex < text.length) {
          setCurrentText(text.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setTextIndex((prev) => (prev + 1) % texts.length);
            setCurrentText('');
          }, 2000);
        }
      }, 100);
    };

    startTyping();

    return () => {
      if (typeInterval) {
        clearInterval(typeInterval);
      }
    };
  }, [textIndex, texts]);

  const handleStart = () => {
    navigate('/auth');
  };

  const features = [
    {
      title: '多AI模型',
      description: '支持GPT、Claude、DeepSeek等9种主流AI模型'
    },
    {
      title: '角色扮演',
      description: '正方、反方、裁判，每个角色都有独特的音色'
    },
    {
      title: '语音合成',
      description: '火山引擎TTS技术，让辩论更加生动'
    },
    {
      title: '案例库',
      description: '保存精彩辩论，与社区分享智慧结晶'
    }
  ];

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden'
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

      {/* 青色荧光点缀 */}
      <div 
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '2px',
          height: '100px',
          background: 'linear-gradient(to bottom, transparent, #00ffff, transparent)',
          opacity: 0.6,
          animation: 'pulse 3s infinite'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '30%',
          left: '15%',
          width: '100px',
          height: '2px',
          background: 'linear-gradient(to right, transparent, #00ffff, transparent)',
          opacity: 0.6,
          animation: 'pulse 3s infinite',
          animationDelay: '1s'
        }}
      />

      {/* 主要内容 */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '0 2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Logo和标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 300,
              letterSpacing: '0.2em',
              marginBottom: '1rem',
              color: '#ffffff',
              position: 'relative'
            }}
          >
            DINCI
            <div 
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #00ffff, transparent)',
                opacity: 0.8
              }}
            />
          </h1>
          
          <div style={{ height: '2rem', marginBottom: '2rem' }}>
            <span 
              style={{
                fontSize: '1.125rem',
                color: '#00ffff',
                fontWeight: 300,
                letterSpacing: '0.05em'
              }}
            >
              {currentText}
              <span style={{ opacity: 0.7, animation: 'pulse 1s infinite' }}>|</span>
            </span>
          </div>
          
          <p 
            style={{
              fontSize: '1rem',
              color: '#888888',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
              fontWeight: 300
            }}
          >
            探索AI驱动的智能辩论平台，体验思维碰撞的无限可能
          </p>
        </div>

        {/* 特性展示 - 简约卡片 */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem',
            width: '100%',
            maxWidth: '1000px'
          }}
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  marginBottom: '0.75rem'
                }}
              >
                {feature.title}
              </h3>
              <p 
                style={{
                  color: '#888888',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  fontWeight: 300
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 简约开始按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Button
            size="large"
            onClick={handleStart}
            style={{
              background: 'transparent',
              border: '1px solid #00ffff',
              color: '#00ffff',
              padding: '1rem 3rem',
              fontSize: '1rem',
              fontWeight: 400,
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            开始体验
          </Button>
          <p 
            style={{
              color: '#666666',
              fontSize: '0.875rem',
              marginTop: '1rem',
              fontWeight: 300
            }}
          >
            进入AI辩论的世界
          </p>
        </div>

        {/* 底部简约装饰 */}
        <div 
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '1px',
            background: 'linear-gradient(to right, transparent, #00ffff, transparent)',
            opacity: 0.5
          }}
        />
      </div>
    </div>
  );
};
