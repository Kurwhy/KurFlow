import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, ChevronDown, History, Minus, Plus, Send, Tag, UserRound, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DueDateBadge } from '@/components/ui/DueDateBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Textarea, useFieldId } from '@/components/ui/Input';
import { Popover, PopoverPanel, PopoverTrigger } from '@/components/ui/Popover';
import { Skeleton } from '@/components/ui/Skeleton';
import { SlideOver } from '@/components/ui/SlideOver';
import { useToast } from '@/components/ui/Toast';
import {
    apiErrorMessage,
    createCommentRequest,
    fetchCardRequest,
    updateCardRequest,
    type CardUpdatePayload,
} from '@/lib/api';
import { formatDate, formatDateTime, formatDateRange, formatTime } from '@/lib/format';
import type {
    Card,
    CardActivity,
    CardComment,
    Label,
    Sprint,
    User,
} from '@/types/kurflow';

interface IncomingComment {
    key: number;
    cardId: string;
    comment: CardComment;
    count: number;
}

interface IncomingActivity {
    key: number;
    cardId: string;
    activity: CardActivity;
}

interface CardDrawerProps {
    cardId: string | null;
    baseCard: Card | null;
    boardId: string;
    boardName: string;
    members: User[];
    labels: Label[];
    activeSprint: Sprint | null;
    currentUser: User | null;
    refreshKey: number;
    incomingComment: IncomingComment | null;
    incomingActivity: IncomingActivity | null;
    onClose: () => void;
    onCardLoaded: (card: Card) => void;
    onCardUpdated: (card: Card) => void;
    onCommentCount: (cardId: string, count: number) => void;
}

export function CardDrawer(props: CardDrawerProps) {
    const {
        cardId,
        baseCard,
        boardName,
        members,
        labels,
        activeSprint,
        currentUser,
        refreshKey,
        incomingComment,
        incomingActivity,
        onClose,
        onCardLoaded,
        onCardUpdated,
        onCommentCount,
    } = props;

    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [card, setCard] = useState<Card | null>(null);
    const [comments, setComments] = useState<CardComment[]>([]);
    const [activities, setActivities] = useState<CardActivity[]>([]);
    const [title, setTitle] = useState('');
    const [titleError, setTitleError] = useState<string | undefined>();
    const [savingTitle, setSavingTitle] = useState(false);
    const [body, setBody] = useState('');
    const [commentError, setCommentError] = useState<string | undefined>();
    const [postingComment, setPostingComment] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [retry, setRetry] = useState(0);
    const titleId = useFieldId('card-title');
    const commentId = useFieldId('card-comment');
    const titleFocused = useRef(false);
    const onCardLoadedRef = useRef(onCardLoaded);
    onCardLoadedRef.current = onCardLoaded;

    useEffect(() => {
        if (!cardId) {
            setCard(null);
            setComments([]);
            setActivities([]);
            setLoading(false);
            setError(undefined);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(undefined);
        setCard(null);
        setComments([]);
        setActivities([]);
        setTitle('');
        setBody('');
        setCommentError(undefined);

        fetchCardRequest(cardId)
            .then((detail) => {
                if (cancelled) return;
                setCard(detail.card);
                setComments(detail.comments);
                setActivities(detail.activities);
                setTitle(detail.card.title);
                onCardLoadedRef.current(detail.card);
            })
            .catch((caught) => {
                if (cancelled) return;
                setError(apiErrorMessage(caught, 'Kartu tidak ditemukan.'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [cardId, refreshKey, retry]);

    useEffect(() => {
        if (!incomingComment || incomingComment.cardId !== cardId) return;
        setComments((current) =>
            current.some((comment) => comment.id === incomingComment.comment.id)
                ? current
                : [...current, incomingComment.comment],
        );
        setCard((current) =>
            current && current.commentCount !== incomingComment.count
                ? { ...current, commentCount: incomingComment.count }
                : current,
        );
    }, [incomingComment, cardId]);

    useEffect(() => {
        if (!incomingActivity || incomingActivity.cardId !== cardId) return;
        setActivities((current) =>
            current.some((activity) => activity.id === incomingActivity.activity.id)
                ? current
                : [incomingActivity.activity, ...current],
        );
    }, [incomingActivity, cardId]);

    useEffect(() => {
        if (!baseCard || !card || baseCard.id !== card.id) return;

        setCard((current) =>
            current
                ? {
                      ...current,
                      title: baseCard.title,
                      assigneeId: baseCard.assigneeId,
                      dueDate: baseCard.dueDate,
                      labelIds: baseCard.labelIds,
                      sprintId: baseCard.sprintId,
                      columnId: baseCard.columnId,
                      rank: baseCard.rank,
                      commentCount: baseCard.commentCount,
                  }
                : current,
        );

        if (!titleFocused.current) {
            setTitle(baseCard.title);
        }
    }, [
        baseCard?.id,
        baseCard?.title,
        baseCard?.assigneeId,
        baseCard?.dueDate,
        baseCard?.sprintId,
        baseCard?.labelIds,
        baseCard?.commentCount,
        baseCard?.columnId,
        baseCard?.rank,
    ]);

    const assignee = card?.assigneeId
        ? members.find((member) => member.id === card.assigneeId) ?? card.assignee ?? null
        : null;
    const inSprint = Boolean(activeSprint && card?.sprintId === activeSprint.id);

    async function applyPatch(payload: CardUpdatePayload, fallback: string) {
        if (!card) return false;
        try {
            const updated = await updateCardRequest(card.id, payload);
            setCard(updated);
            onCardUpdated(updated);
            if (!titleFocused.current) setTitle(updated.title);
            return true;
        } catch (caught) {
            toast.push(apiErrorMessage(caught, fallback), 'error');
            return false;
        }
    }

    function commitTitle() {
        if (!card) return;
        const trimmed = title.trim();
        if (trimmed.length < 1 || trimmed.length > 200) {
            setTitleError('Judul kartu wajib diisi, 1 sampai 200 karakter.');
            setTitle(card.title);
            return;
        }
        if (trimmed === card.title) {
            setTitleError(undefined);
            return;
        }
        setSavingTitle(true);
        setTitleError(undefined);
        updateCardRequest(card.id, { title: trimmed })
            .then((updated) => {
                setCard(updated);
                setTitle(updated.title);
                onCardUpdated(updated);
            })
            .catch((caught) => {
                setTitle(card.title);
                setTitleError(apiErrorMessage(caught, 'Judul gagal disimpan.'));
            })
            .finally(() => setSavingTitle(false));
    }

    function toggleLabel(labelId: string) {
        if (!card) return;
        const has = card.labelIds.includes(labelId);
        const labelIds = has
            ? card.labelIds.filter((id) => id !== labelId)
            : [...card.labelIds, labelId];
        void applyPatch({ labelIds }, 'Label gagal disimpan.');
    }

    function toggleSprint() {
        if (!card || !activeSprint) return;
        const sprintId = inSprint ? null : activeSprint.id;
        void applyPatch({ sprintId }, 'Sprint kartu gagal disimpan.').then((saved) => {
            if (saved) {
                toast.push(inSprint ? 'Kartu dikeluarkan dari sprint.' : `Kartu masuk ke ${activeSprint.name}.`);
            }
        });
    }

    async function submitComment(event?: FormEvent) {
        event?.preventDefault();
        if (!card || postingComment) return;
        const trimmed = body.trim();
        if (trimmed.length < 1) {
            setCommentError('Komentar wajib diisi.');
            return;
        }
        if (trimmed.length > 2000) {
            setCommentError('Komentar maksimal 2000 karakter.');
            return;
        }

        setPostingComment(true);
        setCommentError(undefined);
        try {
            const result = await createCommentRequest(card.id, trimmed);
            setComments((current) =>
                current.some((comment) => comment.id === result.comment.id)
                    ? current
                    : [...current, result.comment],
            );
            setCard((current) => (current ? { ...current, commentCount: result.commentCount } : current));
            setBody('');
            onCommentCount(card.id, result.commentCount);
        } catch (caught) {
            setCommentError(apiErrorMessage(caught, 'Komentar gagal dikirim.'));
        } finally {
            setPostingComment(false);
        }
    }

    return (
        <SlideOver
            open={Boolean(cardId)}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="Detail kartu"
        >
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hairline px-5">
                    <p className="min-w-0 truncate text-xs text-muted">
                        {boardName}
                        <span aria-hidden="true"> · </span>
                        Detail kartu
                    </p>
                    <DialogPrimitive.Close asChild>
                        <Button variant="ghost" size="icon" aria-label="Tutup detail kartu">
                            <X size={16} aria-hidden="true" />
                        </Button>
                    </DialogPrimitive.Close>
                </div>

                {loading ? (
                    <div className="space-y-5 p-5">
                        <Skeleton className="h-7 w-4/5" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : error || !card ? (
                    <div className="flex flex-1 items-center justify-center p-5">
                        <EmptyState
                            icon={<X size={18} aria-hidden="true" />}
                            title="Kartu tidak ditemukan"
                            description={error ?? 'Kartu ini tidak ada atau Anda tidak punya akses ke sini.'}
                            action={
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
                                        Coba lagi
                                    </Button>
                                    <Button variant="ghost" onClick={onClose}>
                                        Tutup
                                    </Button>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="px-5 pt-4">
                            <label htmlFor={titleId} className="text-[11px] font-medium text-muted">
                                Judul
                            </label>
                            <textarea
                                id={titleId}
                                value={title}
                                rows={2}
                                maxLength={200}
                                aria-label="Judul kartu"
                                aria-invalid={Boolean(titleError) || undefined}
                                disabled={savingTitle}
                                onFocus={() => {
                                    titleFocused.current = true;
                                }}
                                onBlur={() => {
                                    titleFocused.current = false;
                                    commitTitle();
                                }}
                                onChange={(event) => setTitle(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        event.currentTarget.blur();
                                    }
                                    if (event.key === 'Escape') {
                                        event.stopPropagation();
                                        setTitle(card.title);
                                        setTitleError(undefined);
                                        event.currentTarget.blur();
                                    }
                                }}
                                className="mt-1 max-h-[120px] w-full resize-none overflow-y-auto rounded-btn border border-transparent bg-transparent px-1 py-1 text-[20px] font-semibold leading-snug tracking-tight text-paper [field-sizing:content] hover:border-hairline focus:border-gold-400 focus:outline-none disabled:opacity-40"
                            />
                            {titleError ? (
                                <p role="alert" className="mt-1 text-xs text-danger-soft">
                                    {titleError}
                                </p>
                            ) : null}
                        </div>

                        <dl className="mt-4 divide-y divide-hairline border-t border-hairline px-5">
                            <div className="grid grid-cols-[88px_1fr] items-start gap-3 py-3">
                                <dt className="pt-1 text-xs text-muted">Assignee</dt>
                                <dd>
                                    <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="secondary" size="sm" className="w-full justify-between" aria-label="Pilih assignee">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    {assignee ? (
                                                        <>
                                                            <Avatar name={assignee.name} avatarUrl={assignee.avatarUrl} size="xs" />
                                                            <span className="truncate">{assignee.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserRound size={13} aria-hidden="true" className="text-faint" />
                                                            <span className="truncate text-muted">Belum ditugaskan</span>
                                                        </>
                                                    )}
                                                </span>
                                                <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-faint" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverPanel className="w-[280px]">
                                            <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">Anggota board</p>
                                            <div className="max-h-56 overflow-y-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAssigneeOpen(false);
                                                        void applyPatch({ assigneeId: null }, 'Assignee gagal disimpan.');
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-muted hover:bg-white/[0.04] hover:text-paper max-sm:py-3"
                                                >
                                                    <span className="flex h-5 w-5 items-center justify-center">
                                                        <X size={12} aria-hidden="true" />
                                                    </span>
                                                    Belum ditugaskan
                                                </button>
                                                {members.map((member) => (
                                                    <button
                                                        key={member.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setAssigneeOpen(false);
                                                            void applyPatch({ assigneeId: member.id }, 'Assignee gagal disimpan.');
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-paper hover:bg-white/[0.04] max-sm:py-3"
                                                    >
                                                        <Avatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
                                                        <span className="min-w-0 flex-1 truncate">{member.name}</span>
                                                        {card.assigneeId === member.id ? (
                                                            <Check size={13} aria-hidden="true" className="text-gold-300" />
                                                        ) : null}
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverPanel>
                                    </Popover>
                                </dd>
                            </div>

                            <div className="grid grid-cols-[88px_1fr] items-start gap-3 py-3">
                                <dt className="pt-1.5 text-xs text-muted">Due date</dt>
                                <dd className="flex flex-wrap items-center gap-2">
                                    <Input
                                        type="date"
                                        aria-label="Due date kartu"
                                        value={card.dueDate ?? ''}
                                        onChange={(event) => {
                                            const value = event.target.value || null;
                                            void applyPatch({ dueDate: value }, 'Due date gagal disimpan.');
                                        }}
                                        className="h-8 w-[160px] max-sm:h-11"
                                    />
                                    <DueDateBadge date={card.dueDate} />
                                    {card.dueDate ? (
                                        <button
                                            type="button"
                                            aria-label="Hapus due date"
                                            onClick={() => {
                                                void applyPatch({ dueDate: null }, 'Due date gagal dihapus.');
                                            }}
                                            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-faint hover:bg-white/[0.04] hover:text-paper max-sm:h-11 max-sm:w-11"
                                        >
                                            <X size={13} aria-hidden="true" />
                                        </button>
                                    ) : null}
                                </dd>
                            </div>

                            <div className="grid grid-cols-[88px_1fr] items-start gap-3 py-3">
                                <dt className="flex items-center gap-1.5 pt-0.5 text-xs text-muted">
                                    <Tag size={12} aria-hidden="true" />
                                    Label
                                </dt>
                                <dd>
                                    {labels.length === 0 ? (
                                        <p className="text-[13px] leading-relaxed text-muted">
                                            Belum ada label di board ini.{' '}
                                            <a href={`/boards/${props.boardId}/settings`} className="text-gold-300 underline-offset-4 hover:underline">
                                                Buat label
                                            </a>
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {labels.map((label) => {
                                                const selected = card.labelIds.includes(label.id);
                                                return (
                                                    <button
                                                        key={label.id}
                                                        type="button"
                                                        onClick={() => toggleLabel(label.id)}
                                                        aria-pressed={selected}
                                                        className={`inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-1 text-[12px] transition-colors duration-150 max-sm:py-3 ${
                                                            selected
                                                                ? 'border-gold-400/50 bg-gold-400/10 text-paper'
                                                                : 'border-hairline text-muted hover:border-hairline-hover hover:text-paper'
                                                        }`}
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                                                        {label.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </dd>
                            </div>
                        </dl>

                        <div className="border-t border-hairline px-5 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-[13px] font-semibold text-paper">Sprint</h2>
                                    <p className="mt-0.5 text-[12px] text-muted tnum">
                                        {activeSprint
                                            ? `${activeSprint.name} · ${formatDateRange(activeSprint.startDate, activeSprint.endDate)}`
                                            : 'Board ini belum punya sprint aktif.'}
                                    </p>
                                </div>
                                {activeSprint ? (
                                    <Button variant="secondary" size="sm" onClick={toggleSprint}>
                                        {inSprint ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
                                        {inSprint ? 'Keluarkan dari Sprint' : 'Masukkan ke Sprint Aktif'}
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" disabled title="Board ini belum punya sprint aktif.">
                                        <Plus size={13} aria-hidden="true" />
                                        Masukkan ke Sprint Aktif
                                    </Button>
                                )}
                            </div>
                            {inSprint && activeSprint ? (
                                <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted">
                                    <span aria-hidden="true" className="h-3 w-0.5 rounded-full bg-gold-400" />
                                    Ada di {activeSprint.name}
                                </p>
                            ) : null}
                            {!activeSprint ? (
                                <p className="mt-2 text-[11px] text-muted">
                                    Jalankan sprint dulu di halaman Sprint untuk mengelompokkan kartu.
                                </p>
                            ) : null}
                        </div>

                        <section className="border-t border-hairline px-5 py-4" aria-label="Komentar kartu">
                            <h2 className="text-[13px] font-semibold text-paper">
                                Komentar <span className="text-muted tnum">({comments.length})</span>
                            </h2>

                            {comments.length === 0 ? (
                                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                                    Belum ada komentar. Mulai diskusi di kartu ini.
                                </p>
                            ) : (
                                <ul className="mt-3 space-y-3">
                                    {comments.map((comment) => (
                                        <li key={comment.id} className="flex gap-2.5">
                                            <Avatar name={comment.user.name} avatarUrl={comment.user.avatarUrl} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-baseline gap-x-2">
                                                    <span className="text-[12px] font-medium text-paper">{comment.user.name}</span>
                                                    <time
                                                        dateTime={comment.createdAt}
                                                        className="text-[11px] text-muted tnum"
                                                        title={formatTime(comment.createdAt)}
                                                    >
                                                        {formatDateTime(comment.createdAt)}
                                                    </time>
                                                </div>
                                                <p className="mt-0.5 max-w-[70ch] whitespace-pre-wrap break-words text-[15px] leading-[1.6] text-paper">
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <form onSubmit={submitComment} className="mt-4 flex gap-2.5">
                                {currentUser ? (
                                    <Avatar name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                    <Textarea
                                        id={commentId}
                                        value={body}
                                        rows={2}
                                        maxLength={2000}
                                        aria-label="Tulis komentar"
                                        placeholder="Tulis komentar"
                                        invalid={Boolean(commentError)}
                                        onChange={(event) => {
                                            setBody(event.target.value);
                                            setCommentError(undefined);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                                                event.preventDefault();
                                                void submitComment();
                                            }
                                        }}
                                        className="min-h-[64px]"
                                    />
                                    {commentError ? (
                                        <p role="alert" className="mt-1 text-xs text-danger-soft">{commentError}</p>
                                    ) : null}
                                    <div className="mt-1.5 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-muted">Ctrl+Enter untuk mengirim</span>
                                        <Button type="submit" variant="primary" size="sm" disabled={postingComment || body.trim().length === 0}>
                                            <Send size={12} aria-hidden="true" />
                                            {postingComment ? 'Mengirim...' : 'Kirim'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        <section className="border-t border-hairline px-5 py-4" aria-label="Riwayat kartu">
                            <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-paper">
                                <History size={13} aria-hidden="true" className="text-muted" />
                                Riwayat
                            </h2>
                            {activities.length === 0 ? (
                                <p className="mt-2 text-[13px] leading-relaxed text-muted">Belum ada perpindahan kolom.</p>
                            ) : (
                                <ul className="mt-3 space-y-2.5">
                                    {activities.map((activity) => (
                                        <li key={activity.id} className="flex gap-2.5">
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hairline text-faint">
                                                <History size={11} aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[12px] leading-relaxed text-muted">
                                                    <span className="font-medium text-paper">{activity.user.name}</span>{' '}
                                                    memindahkan dari{' '}
                                                    <span className="text-paper">{activity.fromColumnName}</span> ke{' '}
                                                    <span className="text-paper">{activity.toColumnName}</span>
                                                    <time dateTime={activity.createdAt} className="whitespace-nowrap text-[11px] text-muted tnum">
                                                        , {formatDateTime(activity.createdAt)}
                                                    </time>
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <div className="px-5 pb-4 text-[11px] text-muted">
                            {card.dueDate ? `Due ${formatDate(card.dueDate)} · ` : ''}
                            Dibuat oleh {card.creator?.name ?? 'Pengguna'}
                        </div>
                    </div>
                )}
            </div>
        </SlideOver>
    );
}
