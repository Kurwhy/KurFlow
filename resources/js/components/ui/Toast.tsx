import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '@/lib/format';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    kind: ToastKind;
}

interface ToastContextValue {
    push: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast harus dipakai di dalam ToastProvider.');
    }
    return context;
}

const kindStyles: Record<ToastKind, { icon: ReactNode; className: string }> = {
    success: { icon: <CheckCircle2 size={16} aria-hidden="true" />, className: 'text-gold-300' },
    error: { icon: <AlertCircle size={16} aria-hidden="true" />, className: 'text-danger' },
    info: { icon: <Info size={16} aria-hidden="true" />, className: 'text-muted' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const remove = useCallback((id: number) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (message: string, kind: ToastKind = 'info') => {
            counter.current += 1;
            const id = counter.current;
            setToasts((current) => [...current, { id, message, kind }]);
            window.setTimeout(() => remove(id), 4800);
        },
        [remove],
    );

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
                {toasts.map((toast) => {
                    const style = kindStyles[toast.kind];
                    return (
                        <div
                            key={toast.id}
                            role={toast.kind === 'error' ? 'alert' : 'status'}
                            className={cn(
                                'pointer-events-none flex animate-toast-in items-start gap-2 rounded-[8px] border bg-panel px-3 py-2.5 text-[13px] leading-relaxed text-paper shadow-panel',
                                toast.kind === 'error' ? 'border-danger/40' : 'border-hairline',
                            )}
                        >
                            <span className={cn('mt-0.5 shrink-0', style.className)}>{style.icon}</span>
                            <span className="min-w-0 flex-1 break-words">{toast.message}</span>
                            <button
                                type="button"
                                aria-label="Tutup notifikasi"
                                onClick={() => remove(toast.id)}
                                className="pointer-events-auto -mr-1 -mt-0.5 flex h-7 w-7 items-center justify-center rounded-[4px] text-faint hover:bg-white/[0.04] hover:text-paper max-sm:h-11 max-sm:w-11"
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
