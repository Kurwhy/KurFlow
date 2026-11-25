import { cn, initials } from '@/lib/format';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<AvatarSize, { circle: string; text: string; px: number }> = {
    xs: { circle: 'h-5 w-5', text: 'text-[9px]', px: 20 },
    sm: { circle: 'h-7 w-7', text: 'text-[10px]', px: 28 },
    md: { circle: 'h-8 w-8', text: 'text-[11px]', px: 32 },
    lg: { circle: 'h-10 w-10', text: 'text-xs', px: 40 },
};

interface AvatarProps {
    name: string;
    avatarUrl?: string;
    size?: AvatarSize;
    online?: boolean;
    bordered?: boolean;
}

export function Avatar({ name, avatarUrl, size = 'sm', online = false, bordered = false }: AvatarProps) {
    const config = sizeClasses[size];

    return (
        <span
            role="img"
            aria-label={name}
            title={name}
            className={cn('relative inline-flex shrink-0 rounded-full', config.circle)}
        >
            {avatarUrl ? (
                <img
                    src={avatarUrl}
                    alt={name}
                    width={config.px}
                    height={config.px}
                    className={cn(
                        'h-full w-full rounded-full bg-hairline object-cover',
                        bordered && 'ring-2 ring-ink',
                    )}
                />
            ) : (
                <span
                    aria-hidden="true"
                    className={cn(
                        'flex h-full w-full items-center justify-center rounded-full bg-hairline font-medium text-paper',
                        config.text,
                        bordered && 'ring-2 ring-ink',
                    )}
                >
                    {initials(name)}
                </span>
            )}
            {online ? (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-[3px] rounded-full border-2 border-emerald"
                />
            ) : null}
        </span>
    );
}
