import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className = '' }) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 36, height: 42, textClass: 'text-lg', subClass: 'text-[9px]' };
      case 'md':
        return { width: 48, height: 56, textClass: 'text-2xl', subClass: 'text-[10px]' };
      case 'lg':
        return { width: 80, height: 95, textClass: 'text-3xl', subClass: 'text-xs' };
      case 'xl':
        return { width: 140, height: 165, textClass: 'text-5xl', subClass: 'text-sm' };
      default:
        return { width: 48, height: 56, textClass: 'text-2xl', subClass: 'text-[10px]' };
    }
  };

  const dim = getDimensions();

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Visual Icon with Lovers Heart Silhouette */}
      <div className="relative flex items-center justify-center">
        <svg
          width={dim.width}
          height={dim.height}
          viewBox="0 0 200 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
        >
          <defs>
            <linearGradient id="purpleGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="35%" stopColor="#c084fc" />
              <stop offset="70%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>
            <linearGradient id="metallicPurple" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="40%" stopColor="#c084fc" />
              <stop offset="80%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <radialGradient id="centerAura" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx="100" cy="95" r="75" fill="url(#centerAura)" />

          {/* Outer glowing heart contour */}
          <path
            d="M 100,195 C 45,145 10,105 10,65 C 10,32 35,10 68,10 C 85,10 95,20 100,32 C 105,20 115,10 132,10 C 165,10 190,32 190,65 C 190,105 155,145 100,195 Z"
            stroke="url(#purpleGlowGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#neonBlur)"
          />

          {/* Inner smooth neon ribbon */}
          <path
            d="M 100,180 C 55,135 25,100 25,68 C 25,42 45,24 70,24 C 84,24 93,32 100,45 C 107,32 116,24 130,24 C 155,24 175,42 175,68 C 175,100 145,135 100,180 Z"
            stroke="#e9d5ff"
            strokeWidth="2.5"
            strokeOpacity="0.85"
            fill="none"
          />

          {/* Left Silhouette (Man's Profile facing Right) */}
          <path
            d="M 68,36 C 65,48 68,60 76,68 C 72,75 75,85 79,88 C 76,95 80,102 85,108 C 80,118 84,130 92,142 C 96,148 98,154 99,165"
            stroke="url(#purpleGlowGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right Silhouette (Woman's Profile facing Left) */}
          <path
            d="M 132,36 C 135,48 132,60 124,68 C 128,75 125,85 121,88 C 124,95 120,102 115,108 C 120,118 116,130 108,142 C 104,148 102,154 101,165"
            stroke="url(#purpleGlowGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Interlocking Heart Kiss Spark */}
          <circle cx="100" cy="98" r="3.5" fill="#fdf4ff" filter="url(#neonBlur)" />
          <path
            d="M 98,185 L 100,198 L 102,185"
            stroke="url(#purpleGlowGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography Logo text */}
      <div className="flex flex-col items-center mt-1 text-center">
        <div className="flex items-baseline space-x-1.5 leading-none">
          <span className={`font-black tracking-tight font-display text-gradient-purple ${dim.textClass}`}>
            UoA
          </span>
          <span className={`font-serif italic font-medium text-purple-200 tracking-normal ${dim.textClass} flex items-center`}>
            MeetUps
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center space-x-2 mt-1.5 text-purple-300/80 tracking-[0.28em] font-bold uppercase text-[9px] sm:text-[10px]">
            <span>CONNECT</span>
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            <span>MEET</span>
            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
            <span>BELONG</span>
          </div>
        )}
      </div>
    </div>
  );
};
