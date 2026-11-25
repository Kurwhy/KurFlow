import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card, Label, User } from '@/types/kurflow';
import { KanbanCardView } from './KanbanCard';

interface SortableKanbanCardProps {
    card: Card;
    columnId: string;
    labels: Label[];
    assignee: User | null;
    commentCount: number;
    inSprint: boolean;
    flash: boolean;
    onOpen: (cardId: string) => void;
}

export function SortableKanbanCard(props: SortableKanbanCardProps) {
    const { card, columnId, labels, assignee, commentCount, inSprint, flash, onOpen } = props;
    const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `card:${card.id}`,
        data: { type: 'card', cardId: card.id, columnId },
        transition: { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={isDragging ? 'opacity-40' : undefined}
            {...listeners}
        >
            <button
                type="button"
                onClick={() => onOpen(card.id)}
                aria-label={`Buka kartu ${card.title}`}
                className="block w-full cursor-grab rounded-card focus-visible:outline-offset-2 active:cursor-grabbing"
            >
                <KanbanCardView
                    card={card}
                    labels={labels}
                    assignee={assignee}
                    commentCount={commentCount}
                    inSprint={inSprint}
                    flash={flash}
                />
            </button>
        </div>
    );
}
