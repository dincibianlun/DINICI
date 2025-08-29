import { ReactNode, useState, useEffect } from 'react';

interface SpeakerHighlightProps {
  speaker: 'host' | 'positive' | 'negative' | 'judge';
  children: ReactNode;
  isActive?: boolean;
}

export const SpeakerHighlight = ({ speaker, children, isActive = false }: SpeakerHighlightProps) => {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const getSpeakerStyle = () => {
    const baseStyle = 'p-4 rounded-lg border-2 transition-all duration-300 hover:scale-[1.02]';
    const flashStyle = isFlashing ? 'animate-pulse ring-2 ring-opacity-50' : '';
    
    switch (speaker) {
      case 'host':
        return `${baseStyle} border-cyan-500 bg-cyan-900/20 ${flashStyle} ring-cyan-400`;
      case 'positive':
        return `${baseStyle} border-green-500 bg-green-900/20 ${flashStyle} ring-green-400`;
      case 'negative':
        return `${baseStyle} border-red-500 bg-red-900/20 ${flashStyle} ring-red-400`;
      case 'judge':
        return `${baseStyle} border-yellow-500 bg-yellow-900/20 ${flashStyle} ring-yellow-400`;
      default:
        return `${baseStyle} border-purple-500 bg-purple-900/20 ${flashStyle} ring-purple-400`;
    }
  };

  return (
    <div className={getSpeakerStyle()}>
      {children}
    </div>
  );
};