import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone';
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, weight = 'regular', className = '' }) => {
  return <i className={`ph-${weight} ph-${name} ${className}`} style={{ fontSize: size }} />;
};
