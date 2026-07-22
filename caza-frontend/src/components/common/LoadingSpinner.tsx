import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-5 h-5',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '2px solid rgba(108, 99, 255, 0.15)',
        }}
      />
      {/* Spinning arc */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          border: '2px solid transparent',
          borderTopColor: '#6C63FF',
          borderRightColor: '#FF6584',
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
