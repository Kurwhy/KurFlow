import type { SprintStatus } from '@/types/kurflow';
import { cn } from '@/lib/format';

const config: Record<SprintStatus, { label: string; className: string; dot: boolean }> = {
    aktif: {
        label: 'Aktif',
        className: 'border-emerald/30 bg-emerald/[0.06] text-emerald',
        dot: true,
    },
    direncanakan: {
        label: 'Direncanakan',
        className: 'border-hairline bg-white/[0.02] text-muted',
        dot: false,
    },
    selesai: {
        label: 'Selesai',
        className: 'border-hairline bg-transparent text-muted',
        dot: false,
    },
};

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
    const item = config[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-[5px] border px-1.5 py-0.5 text-[11px] font-medium',
                item.className,
            )}
        >
            {item.dot ? (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald" />
            ) : null}
            {item.label}
        </span>
    );
}
