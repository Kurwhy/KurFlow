import {
    InputHTMLAttributes,
    ReactNode,
    TextareaHTMLAttributes,
    forwardRef,
    useId,
} from 'react';
import { cn } from '@/lib/format';

const fieldBase =
    'w-full rounded-btn border border-hairline bg-ink text-sm text-paper placeholder:text-muted transition-colors duration-150 hover:border-hairline-hover focus:border-gold-400 disabled:opacity-40';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, invalid, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            aria-invalid={invalid || undefined}
            className={cn(fieldBase, 'h-9 px-3 max-sm:h-11', invalid && 'border-danger', className)}
            {...props}
        />
    );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { className, invalid, ...props },
    ref,
) {
    return (
        <textarea
            ref={ref}
            aria-invalid={invalid || undefined}
            className={cn(
                fieldBase,
                'min-h-[84px] resize-y px-3 py-2',
                invalid && 'border-danger',
                className,
            )}
            {...props}
        />
    );
});

interface FieldProps {
    label: string;
    htmlFor?: string;
    hint?: ReactNode;
    error?: string;
    children: ReactNode;
    className?: string;
}

export function Field({ label, htmlFor, hint, error, children, className }: FieldProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
                    {label}
                </label>
                {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
            </div>
            {children}
            {error ? (
                <p role="alert" className="text-xs text-danger-soft">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

export function useFieldId(prefix: string): string {
    const id = useId();
    return `${prefix}-${id}`;
}
