import { Calendar } from 'lucide-react';
import { cn, dueStatus, formatDate } from '@/lib/format';

interface DueDateBadgeProps {
    date: string | null;
    className?: string;
}

export function DueDateBadge({ date, className }: DueDateBadgeProps) {
    if (!date) return null;
    const status = dueStatus(date);
    if (!status) return null;

    const label = status === 'overdue' ? 'Lewat tenggat' : status === 'today' ? 'Hari ini' : formatDate(date);

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] tnum',
                status === 'overdue' && 'bg-danger/10 text-danger-soft',
                status === 'today' && 'bg-warning/10 text-warning',
                status === 'upcoming' && 'text-muted',
                className,
            )}
        >
            <Calendar size={12} aria-hidden="true" />
            {label}
        </span>
    );
}
