import React from 'react';
import { clsx } from 'clsx';
export { Button } from './Button';
export { Modal } from './Modal';
export { ConfirmDialog } from './ConfirmDialog';
export { ListToolbar, PaginationControls, ListEmptyState, EllipsisText, ListSkeleton } from './listing';
export { DatePicker } from './date-picker';

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => (
  <div className={clsx(
    'bg-card/92 text-card-foreground rounded-2xl border border-border/80 shadow-[0_16px_40px_rgba(63,58,51,0.06)] backdrop-blur-sm p-6',
    className
  )}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ className, children }) => (
  <div className={clsx('mb-5 pb-4 border-b border-border', className)}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <h3 className={clsx('text-lg font-semibold text-foreground', className)}>
    {children}
  </h3>
);

export const CardContent: React.FC<CardProps> = ({ className, children }) => (
  <div className={clsx('', className)}>
    {children}
  </div>
);

// ─── Form Inputs ─────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 text-sm bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground',
          error ? 'border-destructive focus:ring-destructive/30' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-destructive text-xs ml-1">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

import { ChevronDown, Check } from 'lucide-react';
import * as SelectPrimitive from '@radix-ui/react-select';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  triggerClassName?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, error, options, className, value, onChange, triggerClassName, disabled }, ref) => {
    const hasEmptyOption = options.some((opt) => opt.value === '');
    const stringValue = value !== undefined && value !== null ? String(value) : undefined;
    const radixValue = stringValue === '' ? '_empty_value' : stringValue;
    const selectedLabel = options.find((o) => String(o.value) === stringValue)?.label || (!hasEmptyOption ? 'Chọn một tùy chọn' : '');

    return (
      <div className={clsx("space-y-1.5", className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground ml-1">
            {label}
          </label>
        )}
        <SelectPrimitive.Root
          value={radixValue}
          onValueChange={(val) => {
            if (onChange) {
              onChange({ target: { value: val === '_empty_value' ? '' : val } });
            }
          }}
          disabled={disabled}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            className={clsx(
              'flex w-full items-center justify-between rounded-xl border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all text-foreground cursor-pointer data-placeholder:text-muted-foreground',
              error ? 'border-destructive' : 'border-border',
              triggerClassName
            )}
          >
            <SelectPrimitive.Value placeholder="Chọn một tùy chọn">
              {selectedLabel}
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className="relative z-50 max-h-96 min-w-32 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.Viewport className="w-full min-w-(--radix-select-trigger-width) p-1">
                {!hasEmptyOption && (
                  <SelectPrimitive.Item
                    value="_placeholder"
                    disabled
                    className="relative flex w-full cursor-not-allowed select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm opacity-50 outline-none"
                  >
                    <SelectPrimitive.ItemText asChild>Chọn một tùy chọn</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                )}
                {options.map((opt) => {
                  const optValStr = String(opt.value);
                  const itemVal = optValStr === '' ? '_empty_value' : optValStr;
                  return (
                    <SelectPrimitive.Item
                      key={itemVal}
                      value={itemVal}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator asChild>
                          <Check className="h-4 w-4" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  )
                })}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {error && <p className="text-destructive text-xs ml-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground ml-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-4 py-3 text-sm bg-muted border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground resize-none',
          error ? 'border-destructive' : 'border-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-destructive text-xs ml-1">{error}</p>}
    </div>
  )
);
TextArea.displayName = 'TextArea';

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-700',
    outline: 'border border-border text-muted-foreground',
  };
  return (
    <span className={clsx(
      'inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
};

// ─── Alert ────────────────────────────────────────────────────────────────────

interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  const variantStyles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return (
    <div className={clsx('px-4 py-3 rounded-xl border text-sm font-medium', variantStyles[variant])}>
      {children}
    </div>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────

interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ className, children }) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className={clsx('w-full text-sm text-left text-foreground', className)}>
      {children}
    </table>
  </div>
);

export const TableHead: React.FC<TableProps> = ({ className, children }) => (
  <thead className={clsx('text-xs text-muted-foreground uppercase bg-secondary/80 border-b border-border/80', className)}>
    {children}
  </thead>
);

export const TableBody: React.FC<TableProps> = ({ className, children }) => (
  <tbody className={clsx('divide-y divide-border', className)}>
    {children}
  </tbody>
);

export const TableRow: React.FC<TableProps> = ({ className, children }) => (
  <tr className={clsx('hover:bg-secondary/55 transition-colors', className)}>
    {children}
  </tr>
);

interface TableCellProps {
  className?: string;
  children: React.ReactNode;
  header?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({ className, children, header = false }) => {
  const Component = header ? 'th' : 'td';
  return (
    <Component className={clsx('px-6 py-3.5', header && 'font-semibold', className)}>
      {children}
    </Component>
  );
};

// ─── Loading ──────────────────────────────────────────────────────────────────

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <svg className={clsx('animate-spin text-primary', sizeClasses[size])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
};
