import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = '',
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`bg-bg-surface border border-border rounded-xl p-6 ${
        hoverable
          ? 'card-hover gradient-border hover:border-transparent'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
