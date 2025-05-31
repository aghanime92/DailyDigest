import React from 'react';

interface LoaderProps {
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export function Loader({ size = 'default', className = '' }: LoaderProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-6 w-6',
    large: 'h-10 w-10'
  };

  return (
    <div className={`${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`}></div>
    </div>
  );
}