import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'md',
  className,
}) => {
  const variants = {
    purple: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    blue: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    gray: 'bg-dark-700 text-slate-300 border-dark-600',
  };

  const sizes = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 rounded-md',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-lg',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 border uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
