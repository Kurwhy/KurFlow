import { cn } from '@/lib/format';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn('animate-pulse rounded-[4px] bg-white/[0.06] motion-reduce:animate-none', className)}
        />
    );
}
