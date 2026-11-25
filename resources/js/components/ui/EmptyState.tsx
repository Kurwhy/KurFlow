import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center px-4 py-8 text-center', className)}>
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-faint">
                {icon}
            </span>
            <p className="text-sm font-medium text-paper">{title}</p>
            {description ? <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-muted">{description}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
