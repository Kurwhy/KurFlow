import type { Label } from '@/types/kurflow';
import { cn } from '@/lib/format';

interface LabelDotProps {
    label: Pick<Label, 'name' | 'color'>;
    className?: string;
}

export function LabelDot({ label, className }: LabelDotProps) {
    return (
        <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-xs text-muted', className)}>
            <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: label.color }}
            />
            <span className="truncate">{label.name}</span>
        </span>
    );
}
