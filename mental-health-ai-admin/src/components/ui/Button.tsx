import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    loading = false,
    disabled,
    children,
    ref,
    ...props 
  }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
    const baseStyles = 'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
      danger: 'bg-destructive text-destructive-foreground hover:opacity-90',
      ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
      outline: 'bg-transparent border border-border text-foreground hover:bg-accent',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  };

Button.displayName = 'Button';
