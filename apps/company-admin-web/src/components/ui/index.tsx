import React from 'react';
import { create } from 'zustand';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ==================== TOAST STORE ====================
export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map((t) => {
        const colors =
          t.variant === 'error'
            ? 'border-l-[#C94444] bg-white text-[#3D392C]'
            : t.variant === 'warning'
              ? 'border-l-[#C9821E] bg-white text-[#3D392C]'
              : t.variant === 'info'
                ? 'border-l-[#AE887B] bg-[#F9F2EC] text-[#3D392C]'
                : 'border-l-[#15966B] bg-white text-[#3D392C]';

        const Icon =
          t.variant === 'error'
            ? AlertCircle
            : t.variant === 'info'
              ? Info
              : CheckCircle2;

        const iconColor =
          t.variant === 'error'
            ? 'text-[#C94444]'
            : t.variant === 'warning'
              ? 'text-[#C9821E]'
              : t.variant === 'info'
                ? 'text-[#AE887B]'
                : 'text-[#15966B]';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border-l-4 border border-[#E5DCD3] shadow-lg ${colors}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#5E5946]">{t.title}</p>
              {t.message && <p className="text-xs text-[#6E6859] mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[#6E6859] hover:text-[#5E5946] p-0.5 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ==================== BADGE ====================
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-[#F0DED0]/65 text-[#5E5946] border-[#AE887B]/30',
  info: 'bg-[#AE887B]/15 text-[#5E5946] border-[#AE887B]/40',
  success: 'bg-[#ECFDF5] text-[#15966B] border-[#BCEAD5]',
  warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  error: 'bg-[#FEF2F2] text-[#C94444] border-[#FECACA]',
  orange: 'bg-[#F0DED0] text-[#5E5946] border-[#AE887B]/45',
};

export function statusBadgeVariant(status?: string): BadgeVariant {
  const s = String(status || '').toUpperCase();
  if (
    [
      'APPROVED',
      'ACTIVE',
      'PAID',
      'DELIVERED',
      'PUBLISHED',
      'VERIFIED',
      'CONVERTED_TO_ORDER',
      'RESOLVED',
      'CLOSED',
      'SELECTED',
      'COMPLETED',
    ].includes(s)
  ) {
    return 'success';
  }
  if (
    [
      'PENDING',
      'PENDING_VERIFICATION',
      'PENDING_APPROVAL',
      'RESUBMISSION_REQUIRED',
      'INCOMING',
      'UNDER_NEGOTIATION',
      'REQUESTED',
      'DRAFT',
      'PROCESSING',
      'READY_FOR_DISPATCH',
      'IN_PROGRESS',
    ].includes(s)
  ) {
    return 'warning';
  }
  if (['REJECTED', 'SUSPENDED', 'BLOCKED', 'CANCELLED', 'FAILED', 'OUT_OF_STOCK', 'DECLINED'].includes(s)) {
    return 'error';
  }
  if (['DISPATCHED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'VENDOR_ASSIGNED', 'QUOTES_RECEIVED'].includes(s)) {
    return 'orange';
  }
  return 'default';
}

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${BADGE_CLASSES[variant]} ${className}`}
  >
    {children}
  </span>
);

// ==================== BUTTON ====================
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'dark'
  | 'outline'
  | 'ghost'
  | 'accent'
  | 'danger'
  | 'success';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[#AE887B] hover:bg-[#9B7467] active:bg-[#896357] text-white border border-transparent shadow-sm',
    secondary:
      'bg-[#F0DED0] hover:bg-[#E6CEBC] active:bg-[#DCC0AB] text-[#5E5946] border border-[#E5DCD3]',
    dark:
      'bg-[#5E5946] hover:bg-[#4C4838] active:bg-[#3D3A2D] text-white border border-transparent shadow-sm',
    outline:
      'bg-white hover:bg-[#FAF7F4] active:bg-[#F0DED0]/50 text-[#5E5946] border border-[#AE887B]',
    ghost:
      'bg-transparent hover:bg-[#F0DED0]/60 active:bg-[#F0DED0] text-[#5E5946] border border-transparent',
    accent:
      'bg-[#5E5946] hover:bg-[#4C4838] active:bg-[#3D3A2D] text-white border border-transparent shadow-sm',
    success:
      'bg-[#15966B] hover:bg-[#117A57] active:bg-[#0E6447] text-white border border-transparent',
    danger:
      'bg-[#C94444] hover:bg-[#AE3535] active:bg-[#952B2B] text-white border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center text-center leading-snug gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AE887B]/45 disabled:opacity-50 disabled:cursor-not-allowed sm:whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  );
};

// ==================== FORM & TABLE STYLE HELPERS ====================
export const inputClassName =
  'w-full px-3 py-2 text-sm bg-white text-[#3D392C] placeholder:text-[#8E8777] border border-[#E5DCD3] rounded-lg focus:outline-none focus:border-[#AE887B] focus:ring-2 focus:ring-[#AE887B]/20 transition-colors';

export const tableHeadClassName =
  'bg-[#F0DED0]/70 border-b border-[#E5DCD3] text-[11px] font-semibold text-[#5E5946] uppercase tracking-wide';

export const FormField: React.FC<{
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, hint, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-[#5E5946] mb-1">
      {label}
      {required && <span className="text-[#AE887B] ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-[#6E6859] mt-1">{hint}</p>}
    {error && <p className="text-[11px] text-[#C94444] font-medium mt-1">{error}</p>}
  </div>
);

// ==================== CARD ====================
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  tone?: 'default' | 'soft';
}> = ({ children, className = '', title, subtitle, action, noPadding = false, tone = 'default' }) => (
  <div
    className={`${tone === 'soft' ? 'bg-[#F9F2EC]' : 'bg-white'} border border-[#E5DCD3] rounded-xl shadow-card ${className}`}
  >
    {(title || action) && (
      <div className="px-3.5 sm:px-5 py-3.5 sm:py-4 border-b border-[#E5DCD3] flex flex-wrap items-start sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          {title && <h3 className="text-sm font-semibold text-[#5E5946] break-words">{title}</h3>}
          {subtitle && <p className="text-xs text-[#6E6859] mt-0.5 break-words">{subtitle}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2 max-w-full min-w-0">{action}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-3.5 sm:p-5'}>{children}</div>
  </div>
);

// ==================== STAT CARD ====================
export const StatCard: React.FC<{
  label?: string;
  title?: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: 'blue' | 'orange' | 'green' | 'amber' | 'red' | 'primary' | 'secondary' | 'tertiary';
  onClick?: () => void;
}> = ({ label, title, value, hint, icon, tone = 'primary', onClick }) => {
  const heading = label || title || '';
  const toneClasses = {
    primary: 'bg-[#AE887B]/15 text-[#AE887B]',
    secondary: 'bg-[#F0DED0] text-[#5E5946]',
    tertiary: 'bg-[#5E5946] text-white',
    blue: 'bg-[#F0DED0] text-[#5E5946]',
    orange: 'bg-[#AE887B]/18 text-[#AE887B]',
    green: 'bg-[#ECFDF5] text-[#15966B]',
    amber: 'bg-[#FFFBEB] text-[#B45309]',
    red: 'bg-[#FEF2F2] text-[#C94444]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E5DCD3] rounded-xl p-3.5 sm:p-4 shadow-card transition-all min-w-0 ${
        onClick ? 'cursor-pointer hover:border-[#AE887B] hover:shadow-elevated' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#6E6859] break-words">{heading}</p>
          <p className="text-lg sm:text-2xl font-bold text-[#5E5946] mt-1 tracking-tight break-words">{value}</p>
          {hint && <p className="text-xs text-[#6E6859] mt-1 break-words">{hint}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ==================== PAGE HEADER ====================
export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
    <div>
      <h1 className="text-xl font-bold text-[#5E5946]">{title}</h1>
      {description && <p className="text-sm text-[#6E6859] mt-0.5">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

// ==================== MODAL ====================
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#5E5946]/45 backdrop-blur-[1px]">
      <div
        className={`bg-white rounded-xl border border-[#E5DCD3] w-full ${maxWidth} max-h-[90vh] max-h-[90dvh] flex flex-col shadow-xl overflow-hidden`}
      >
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-[#FAF7F4] border-b border-[#E5DCD3] rounded-t-xl flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#5E5946] min-w-0 truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#6E6859] hover:text-[#5E5946] p-1 rounded-lg hover:bg-[#F0DED0]/60 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ==================== DRAWER ====================
export const Drawer: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, subtitle, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#5E5946]/45 backdrop-blur-[1px]">
      <div className="bg-white w-full max-w-2xl h-full h-dvh border-l border-[#E5DCD3] flex flex-col shadow-xl">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF7F4] border-b border-[#E5DCD3] flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-[#5E5946] break-words">{title}</h3>
            {subtitle && <p className="text-xs text-[#6E6859] mt-0.5 break-words">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#6E6859] hover:text-[#5E5946] p-1.5 rounded-lg hover:bg-[#F0DED0]/60 transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ==================== EMPTY STATE ====================
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
    {icon && (
      <div className="w-12 h-12 rounded-xl bg-[#F0DED0] text-[#5E5946] flex items-center justify-center mb-3">
        {icon}
      </div>
    )}
    <p className="text-sm font-semibold text-[#5E5946]">{title}</p>
    <p className="text-xs text-[#6E6859] mt-1 max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ==================== PAGINATION ====================
export const TablePagination: React.FC<{
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}> = ({ total, page, pageSize, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-3 border-t border-[#E5DCD3] bg-[#FAF7F4]/60 text-xs text-[#6E6859]">
      <span>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of{' '}
        {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-[#E5DCD3] bg-white hover:bg-[#F0DED0]/60 text-[#5E5946] disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 font-medium text-[#5E5946]">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-[#E5DCD3] bg-white hover:bg-[#F0DED0]/60 text-[#5E5946] disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
