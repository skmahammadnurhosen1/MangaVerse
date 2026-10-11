import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, showPasswordToggle = false, type = 'text', className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            type={currentType}
            className={clsx(
              'w-full bg-dark-900/90 text-slate-100 placeholder-slate-500 rounded-xl border text-sm transition-all duration-200 outline-none',
              'focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
              icon ? 'pl-11' : 'pl-4',
              showPasswordToggle ? 'pr-11' : 'pr-4',
              'py-2.5',
              error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30' : 'border-dark-700/80 hover:border-dark-600',
              className
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-200 focus:outline-none p-1 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 font-medium pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
