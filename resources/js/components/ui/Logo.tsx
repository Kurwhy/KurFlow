import { cn } from '@/lib/format';

interface LogoProps {
    size?: 'md' | 'lg';
    className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
    const mark = size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
    const text = size === 'lg' ? 'text-[22px]' : 'text-[18px]';

    return (
        <span
            aria-label="KurFlow"
            className={cn('inline-flex select-none items-center gap-2', className)}
        >
            <img
                src="/images/logo_kurflow.png"
                alt=""
                width={size === 'lg' ? 36 : 28}
                height={size === 'lg' ? 36 : 28}
                decoding="async"
                className={cn('shrink-0 rounded-[6px] object-contain', mark)}
            />
            <span className={cn('font-semibold tracking-tight', text)}>
                <span className="text-paper">Kur</span>
                <span className="text-gold-300">Flow</span>
            </span>
        </span>
    );
}
