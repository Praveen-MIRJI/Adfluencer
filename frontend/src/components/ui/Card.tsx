import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'dark';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  const variants = {
    default: 'bg-slate-800/50 border-slate-600/50 backdrop-blur-sm',
    dark: 'bg-slate-900/80 border-slate-700/50 backdrop-blur-sm',
  };

  return (
    <div className={`rounded-xl border shadow-lg shadow-black/10 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }: Omit<CardProps, 'variant'>) {
  return (
    <div className={`px-6 py-4 border-b border-slate-600/50 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }: Omit<CardProps, 'variant'>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }: Omit<CardProps, 'variant'>) {
  return (
    <div className={`px-6 py-4 border-t border-slate-600/50 ${className}`} {...props}>
      {children}
    </div>
  );
}
