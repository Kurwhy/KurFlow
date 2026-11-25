import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { BoardColumn, Card, Label, User } from '@/types/kurflow';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';
import { SortableKanbanCard } from './SortableKanbanCard';

interface KanbanColumnProps {
    column: BoardColumn;
    cards: Card[];
    labelsById: Map<string, Label>;
    usersById: Map<string, User>;
    commentCounts: Record<string, number>;
    activeSprintId: string | null;
    filtered: boolean;
    highlighted: boolean;
    onOpenCard: (cardId: string) => void;
    onRenameColumn: (columnId: string, name: string) => void;
    onCreateCard: (columnId: string, title: string) => Promise<boolean>;
    flashCardId: string | null;
}

export function KanbanColumn({
    column,
    cards,
    labelsById,
    usersById,
    commentCounts,
    activeSprintId,
    filtered,
    highlighted,
    onOpenCard,
    onRenameColumn,
    onCreateCard,
    flashCardId,
}: KanbanColumnProps) {
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(column.name);
    const [adding, setAdding] = useState(false);
    const [title, setTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `column:${column.id}`,
        data: { type: 'column', columnId: column.id },
        transition: { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    });

    function commitName() {
        const trimmed = name.trim();
        if (trimmed.length < 1 || trimmed.length > 40) {
            toast.push('Nama kolom wajib diisi, 1 sampai 40 karakter.', 'error');
            setName(column.name);
            setEditing(false);
            return;
        }
        if (trimmed !== column.name) {
            onRenameColumn(column.id, trimmed);
        }
        setEditing(false);
    }

    async function submitCard() {
        const trimmed = title.trim();
        if (trimmed.length < 1 || trimmed.length > 200) {
            setError('Judul kartu wajib diisi, 1 sampai 200 karakter.');
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            const created = await onCreateCard(column.id, trimmed);
            if (!created) {
                setError('Kartu gagal dibuat. Coba lagi.');
                return;
            }
            setError(null);
            setTitle('');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'flex h-full w-[300px] shrink-0 flex-col rounded-column border bg-surface',
                highlighted ? 'border-gold-400/40' : 'border-hairline',
                isDragging && 'opacity-50',
            )}
            aria-label={`Kolom ${column.name}`}
        >
            <header className="flex min-h-10 shrink-0 items-center gap-1 border-b border-hairline px-2 max-sm:min-h-[52px]">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-label={`Ubah urutan kolom ${column.name}`}
                    className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-[4px] text-faint hover:bg-white/[0.04] hover:text-muted active:cursor-grabbing max-sm:h-11 max-sm:w-11"
                >
                    <GripVertical size={14} aria-hidden="true" />
                </button>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        maxLength={40}
                        aria-label="Nama kolom"
                        onChange={(event) => setName(event.target.value)}
                        onBlur={commitName}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                commitName();
                            }
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                setName(column.name);
                                setEditing(false);
                            }
                        }}
                        className="min-w-0 flex-1 rounded-[4px] border border-gold-400/50 bg-ink px-1.5 py-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-paper focus:outline-none"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setName(column.name);
                            setEditing(true);
                        }}
                        className="flex min-w-0 flex-1 items-center truncate rounded-[4px] px-1 py-1 text-left text-[13px] font-semibold uppercase tracking-[0.04em] text-paper hover:bg-white/[0.03] max-sm:min-h-11"
                        title="Klik untuk ganti nama kolom"
                    >
                        {column.name}
                    </button>
                )}
                <span className="shrink-0 text-[11px] text-muted tnum" aria-label={`${cards.length} kartu`}>
                    {cards.length}
                </span>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                <SortableContext items={cards.map((card) => `card:${card.id}`)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <SortableKanbanCard
                            key={card.id}
                            card={card}
                            columnId={column.id}
                            labels={card.labelIds
                                .map((id) => labelsById.get(id))
                                .filter((label): label is Label => Boolean(label))}
                            assignee={card.assigneeId ? (usersById.get(card.assigneeId) ?? null) : null}
                            commentCount={commentCounts[card.id] ?? 0}
                            inSprint={Boolean(activeSprintId && card.sprintId === activeSprintId)}
                            flash={flashCardId === card.id}
                            onOpen={onOpenCard}
                        />
                    ))}
                </SortableContext>

                {cards.length === 0 ? (
                    <p className="rounded-card border border-hairline px-3 py-6 text-center text-xs leading-relaxed text-muted">
                        {filtered
                            ? 'Tidak ada kartu yang cocok dengan filter.'
                            : 'Belum ada kartu. Tarik kartu ke sini atau klik + Kartu'}
                    </p>
                ) : null}
            </div>

            <div className="shrink-0 border-t border-hairline p-2">
                {adding ? (
                    <div className="rounded-card border border-hairline bg-card p-2">
                        <textarea
                            autoFocus
                            value={title}
                            rows={2}
                            maxLength={200}
                            aria-label="Judul kartu baru"
                            placeholder="Judul kartu"
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setError(null);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    submitCard();
                                }
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    setAdding(false);
                                    setTitle('');
                                    setError(null);
                                }
                            }}
                            className="w-full resize-none bg-transparent text-sm text-paper placeholder:text-muted focus:outline-none"
                        />
                        {error ? (
                            <p role="alert" className="mt-1 text-[11px] text-danger-soft">
                                {error}
                            </p>
                        ) : null}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted">Enter simpan · Esc batal</span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-label="Batal tambah kartu"
                                    onClick={() => {
                                        setAdding(false);
                                        setTitle('');
                                        setError(null);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-[4px] text-faint hover:bg-white/[0.04] hover:text-paper max-sm:h-11 max-sm:w-11"
                                >
                                    <X size={13} aria-hidden="true" />
                                </button>
                                <Button size="sm" variant="primary" onClick={submitCard} disabled={submitting}>
                                    Tambah
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setAdding(true)}
                        aria-label={`Tambah kartu di kolom ${column.name}`}
                    >
                        <Plus size={14} aria-hidden="true" />
                        Kartu
                    </Button>
                )}
            </div>
        </section>
    );
}
