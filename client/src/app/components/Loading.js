import React from 'react';

const Loading = ({
  isLoading,
  size = 'md',
  color = 'blue',
  thickness = 2,
  backdropColor = 'rgba(0, 0, 0, 0.5)',
  zIndex = 50
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    white: 'border-white',
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: backdropColor, zIndex: zIndex }}
    >
      <div
        className={`${sizeClasses[size]} border-t-transparent ${colorClasses[color]} rounded-full animate-spin`}
        style={{ borderWidth: `${thickness}px` }}
        role="status"
        aria-label="Loading"
      ></div>
    </div>
  );
};

export default Loading;

