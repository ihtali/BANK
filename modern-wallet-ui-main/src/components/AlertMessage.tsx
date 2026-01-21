import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertMessageProps {
  type: 'error' | 'success';
  message: string;
  onClose?: () => void;
  className?: string;
}

export function AlertMessage({ type, message, onClose, className }: AlertMessageProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-4 animate-fade-in',
        type === 'error' && 'bg-destructive/10 text-destructive border border-destructive/20',
        type === 'success' && 'bg-success/10 text-success border border-success/20',
        className
      )}
      role="alert"
    >
      {type === 'error' ? (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
