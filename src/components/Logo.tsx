import React from 'react';
import uoaMeetupsLogo from '../assets/uoa-meetups-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

const dimensions: Record<NonNullable<LogoProps['size']>, { width: number; height: number }> = {
  sm: { width: 108, height: 72 },
  md: { width: 150, height: 100 },
  lg: { width: 230, height: 153 },
  xl: { width: 390, height: 260 },
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const dimension = dimensions[size];

  return (
    <img
      src={uoaMeetupsLogo}
      alt="UoA MeetUps — Connect, Meet, Belong"
      width={dimension.width}
      height={dimension.height}
      decoding="async"
      className={`block h-auto w-auto max-w-full select-none object-contain ${className}`}
      draggable={false}
    />
  );
};
