interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'secondary';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    gray: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
    secondary: 'bg-slate-600/30 text-slate-300 border border-slate-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
