import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-gold-400 text-[#141414] hover:bg-gold-300 active:bg-gold-500',
    secondary:
        'border border-hairline bg-transparent text-paper hover:border-hairline-hover hover:bg-white/[0.03] active:bg-white/[0.06]',
    ghost: 'bg-transparent text-muted hover:bg-white/[0.04] hover:text-paper active:bg-white/[0.07]',
    danger: 'border border-danger/40 bg-transparent text-danger hover:bg-danger/10',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-8 px-2.5 text-[13px] max-sm:h-11 max-sm:px-3.5',
    md: 'h-9 px-3.5 text-sm max-sm:h-11 max-sm:px-4',
    icon: 'h-9 w-9 p-0 max-sm:h-11 max-sm:w-11',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { className, variant = 'secondary', size = 'md', type = 'button', ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-btn font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        />
    );
});
