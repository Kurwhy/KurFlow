import { MessageSquare } from 'lucide-react';
import type { Card, Label, User } from '@/types/kurflow';
import { Avatar } from '@/components/ui/Avatar';
import { DueDateBadge } from '@/components/ui/DueDateBadge';
import { cn } from '@/lib/format';

interface KanbanCardViewProps {
    card: Card;
    labels: Label[];
    assignee: User | null;
    commentCount: number;
    inSprint: boolean;
    overlay?: boolean;
    flash?: boolean;
}

export function KanbanCardView({
    card,
    labels,
    assignee,
    commentCount,
    inSprint,
    overlay = false,
    flash = false,
}: KanbanCardViewProps) {
    const shownLabels = labels.slice(0, 2);
    const extraLabels = labels.length - shownLabels.length;

    return (
        <div
            className={cn(
                'relative rounded-card border border-hairline bg-card px-3 py-2.5 text-left transition-colors duration-[120ms]',
                flash && 'card-flash',
                overlay ? 'cursor-grabbing shadow-drag' : 'hover:border-hairline-hover',
            )}
        >
            {inSprint ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-gold-400"
                />
            ) : null}
            <p className="text-sm font-medium leading-snug text-paper">{card.title}</p>

            {shownLabels.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {shownLabels.map((label) => (
                        <span key={label.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                            <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                        </span>
                    ))}
                    {extraLabels > 0 ? (
                        <span className="text-[11px] text-muted tnum">+{extraLabels}</span>
                    ) : null}
                </div>
            ) : null}

            <div className="mt-2 flex min-h-5 items-center gap-2">
                <DueDateBadge date={card.dueDate} />
                {commentCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted tnum">
                        <MessageSquare size={12} aria-hidden="true" />
                        {commentCount}
                    </span>
                ) : null}
                {assignee ? (
                    <span className="ml-auto">
                        <Avatar
                            name={assignee.name}
                            avatarUrl={assignee.avatarUrl}
                            size="xs"
                        />
                    </span>
                ) : null}
            </div>
        </div>
    );
}
