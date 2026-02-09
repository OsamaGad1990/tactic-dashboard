'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ──
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
    duration?: number;
}

interface ToastContextValue {
    toast: (message: string, variant?: ToastVariant, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Hook ──
export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

// ── Toast Item ──
const VARIANT_CONFIG: Record<
    ToastVariant,
    { icon: typeof CheckCircle2; bg: string; border: string; text: string; iconColor: string }
> = {
    success: {
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-800 dark:text-emerald-200',
        iconColor: 'text-emerald-500',
    },
    error: {
        icon: AlertCircle,
        bg: 'bg-red-50 dark:bg-red-950/60',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-500',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        iconColor: 'text-amber-500',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        iconColor: 'text-blue-500',
    },
};

function ToastItem({
    toast: t,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    const [exiting, setExiting] = useState(false);
    const config = VARIANT_CONFIG[t.variant];
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(t.id), 300);
        }, t.duration ?? 4000);
        return () => clearTimeout(timer);
    }, [t.id, t.duration, onDismiss]);

    return (
        <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${config.bg} ${config.border} ${exiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                }`}
            style={{ animation: exiting ? 'none' : 'slideInRight 0.3s ease-out' }}
        >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{t.message}</p>
            <button
                onClick={() => {
                    setExiting(true);
                    setTimeout(() => onDismiss(t.id), 300);
                }}
                className={`flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${config.text}`}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ── Provider ──
let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, variant: ToastVariant = 'info', duration?: number) => {
            const id = `toast-${++toastCounter}-${Date.now()}`;
            setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }]); // max 5 toasts
        },
        []
    );

    const value: ToastContextValue = {
        toast: addToast,
        success: useCallback((msg: string, dur?: number) => addToast(msg, 'success', dur), [addToast]),
        error: useCallback((msg: string, dur?: number) => addToast(msg, 'error', dur), [addToast]),
        warning: useCallback((msg: string, dur?: number) => addToast(msg, 'warning', dur), [addToast]),
        info: useCallback((msg: string, dur?: number) => addToast(msg, 'info', dur), [addToast]),
        dismiss,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Toast Container — fixed top-end */}
            <div className="fixed top-4 end-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem toast={t} onDismiss={dismiss} />
                    </div>
                ))}
            </div>

            {/* Inline animation keyframes */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
