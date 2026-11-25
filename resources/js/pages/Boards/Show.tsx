import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
    type CollisionDetection,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Head, usePage } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AddColumn } from '@/components/board/AddColumn';
import { BoardTopBar } from '@/components/board/BoardTopBar';
import { CardDrawer } from '@/components/board/CardDrawer';
import { KanbanCardView } from '@/components/board/KanbanCard';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AppLayout } from '@/layouts/AppLayout';
import {
    apiErrorMessage,
    createCardRequest,
    createColumnRequest,
    fetchBoardStateRequest,
    mapActivity,
    mapBoardState,
    mapCard,
    mapComment,
    mapSprint,
    mapUser,
    moveCardRequest,
    moveColumnRequest,
    updateColumnRequest,
    type RawBoardState,
} from '@/lib/api';
import { emptyFilters, isFilterActive, matchesFilters, type DueFilter, type FilterState } from '@/lib/filters';
import { compareRank, rankBetween } from '@/lib/rank';
import type {
    BoardColumn,
    Card,
    CardActivity,
    CardComment,
    Label,
    SharedProps,
    Sprint,
    User,
} from '@/types/kurflow';

type DragItem = { type: 'card' | 'column'; id: string };

interface LiveComment {
    key: number;
    cardId: string;
    comment: CardComment;
    count: number;
}

interface LiveActivity {
    key: number;
    cardId: string;
    activity: CardActivity;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

function BoardSkeleton() {
    return (
        <div className="flex flex-1 gap-3 overflow-x-auto p-3 sm:p-4" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, columnIndex) => (
                <div
                    key={columnIndex}
                    className="flex w-[300px] shrink-0 flex-col rounded-column border border-hairline bg-surface"
                >
                    <div className="flex h-10 items-center gap-2 border-b border-hairline px-3">
                        <Skeleton className="h-3 w-4" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-2 p-2">
                        <Skeleton className="h-16 w-full rounded-card" />
                        <Skeleton className="h-16 w-full rounded-card" />
                        <Skeleton className="h-16 w-full rounded-card" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function BoardPage(props: RawBoardState) {
    const page = usePage<SharedProps>();
    const auth = page.props.auth;
    const toast = useToast();
    const [initial] = useState(() => mapBoardState(props));
    const [cards, setCards] = useState<Card[]>(initial.cards);
    const [columns, setColumns] = useState<BoardColumn[]>(initial.columns);
    const [labels, setLabels] = useState<Label[]>(initial.labels);
    const [members, setMembers] = useState<User[]>(initial.members);
    const [activeSprint, setActiveSprint] = useState<Sprint | null>(initial.activeSprint);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FilterState>(emptyFilters);
    const [presenceUsers, setPresenceUsers] = useState<User[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
    const [liveComment, setLiveComment] = useState<LiveComment | null>(null);
    const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);
    const [flashCardId, setFlashCardId] = useState<string | null>(null);
    const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
    const [drawerCardId, setDrawerCardId] = useState<string | null>(() => new URL(window.location.href).searchParams.get('card'));
    const [activeDrag, setActiveDrag] = useState<DragItem | null>(null);
    const [cardPreview, setCardPreview] = useState<Record<string, string[]> | null>(null);
    const [columnPreview, setColumnPreview] = useState<string[] | null>(null);
    const [overColumn, setOverColumn] = useState<string | null>(null);
    const didDragRef = useRef(false);
    const flashTimer = useRef<number | null>(null);
    const liveKey = useRef(0);

    const currentUser: User | null = auth?.user
        ? {
              id: String(auth.user.id),
              name: auth.user.name,
              email: auth.user.email,
              avatarUrl: (auth.user as unknown as { avatar_url?: string }).avatar_url ?? auth.user.avatarUrl,
          }
        : null;

    useEffect(() => {
        const timer = window.setTimeout(() => setLoading(false), 320);
        return () => window.clearTimeout(timer);
    }, []);

    const triggerFlash = useCallback((cardId: string) => {
        setFlashCardId(cardId);
        if (flashTimer.current) window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlashCardId(null), 650);
    }, []);

    const replaceCard = useCallback((incoming: Card) => {
        setCards((current) => current.map((card) => (card.id === incoming.id ? { ...card, ...incoming } : card)));
    }, []);

    useEffect(() => {
        const boardId = String(initial.board.id);
        const channelName = `board.${boardId}`;
        let wasDisconnected = false;
        let disposed = false;

        const replaceState = async () => {
            try {
                const state = await fetchBoardStateRequest(boardId);
                if (disposed) return;
                setColumns(state.columns);
                setCards(state.cards);
                setLabels(state.labels);
                setMembers(state.members);
                setActiveSprint(state.activeSprint);
                setDrawerRefreshKey((key) => key + 1);
            } catch {
                // Keep current state; the next reconnect attempt will try again.
            }
        };

        const channel = window.Echo.join(channelName)
            .here((users: Record<string, any>[]) => {
                setPresenceUsers(users.map(mapUser));
            })
            .joining((user: Record<string, any>) => {
                const mapped = mapUser(user);
                setPresenceUsers((current) =>
                    current.some((item) => item.id === mapped.id) ? current : [...current, mapped],
                );
            })
            .leaving((user: Record<string, any>) => {
                setPresenceUsers((current) => current.filter((item) => item.id !== String(user.id)));
            })
            .listen('.CardCreated', (event: Record<string, any>) => {
                const card = mapCard(event.card);
                setCards((current) => (current.some((item) => item.id === card.id) ? current : [...current, card]));
            })
            .listen('.CardUpdated', (event: Record<string, any>) => {
                replaceCard(mapCard(event.card));
            })
            .listen('.CardMoved', (event: Record<string, any>) => {
                const card = mapCard(event.card);
                replaceCard(card);
                triggerFlash(card.id);
            })
            .listen('.ColumnCreated', (event: Record<string, any>) => {
                const column = {
                    id: String(event.column.id),
                    boardId: String(event.column.board_id),
                    name: event.column.name,
                    rank: event.column.rank,
                };
                setColumns((current) =>
                    current.some((item) => item.id === column.id) ? current : [...current, column],
                );
            })
            .listen('.ColumnUpdated', (event: Record<string, any>) => {
                const column = {
                    id: String(event.column.id),
                    boardId: String(event.column.board_id),
                    name: event.column.name,
                    rank: event.column.rank,
                };
                setColumns((current) => current.map((item) => (item.id === column.id ? column : item)));
            })
            .listen('.ColumnMoved', (event: Record<string, any>) => {
                const column = {
                    id: String(event.column.id),
                    boardId: String(event.column.board_id),
                    name: event.column.name,
                    rank: event.column.rank,
                };
                setColumns((current) => current.map((item) => (item.id === column.id ? column : item)));
            })
            .listen('.CommentCreated', (event: Record<string, any>) => {
                const cardId = String(event.card_id);
                const count = Number(event.comment_count ?? 0);
                setCards((current) =>
                    current.map((card) => (card.id === cardId ? { ...card, commentCount: count } : card)),
                );
                liveKey.current += 1;
                setLiveComment({
                    key: liveKey.current,
                    cardId,
                    comment: mapComment(event.comment),
                    count,
                });
            })
            .listen('.CardActivityCreated', (event: Record<string, any>) => {
                liveKey.current += 1;
                setLiveActivity({
                    key: liveKey.current,
                    cardId: String(event.card_id),
                    activity: mapActivity(event.activity),
                });
            })
            .listen('.SprintUpdated', (event: Record<string, any>) => {
                setActiveSprint(mapSprint(event.active_sprint));
            });

        const connection = (window.Echo.connector as any).pusher.connection;
        let everConnected = false;

        const onConnected = () => {
            everConnected = true;
            window.clearTimeout(graceTimer);
            setConnectionState('connected');
            if (wasDisconnected) {
                wasDisconnected = false;
                void replaceState();
            }
        };

        const onStateChange = (states: { current: string }) => {
            if (states.current === 'connected') {
                onConnected();
                return;
            }

            if (everConnected || ['unavailable', 'failed', 'disconnected'].includes(states.current)) {
                wasDisconnected = true;
                setConnectionState('disconnected');
            }
        };

        const graceTimer = window.setTimeout(() => {
            if (!everConnected) {
                wasDisconnected = true;
                setConnectionState('disconnected');
            }
        }, 4000);

        connection.bind('connected', onConnected);
        connection.bind('state_change', onStateChange);

        if (connection.state === 'connected') {
            onConnected();
        } else {
            setConnectionState('connecting');
        }

        return () => {
            disposed = true;
            window.clearTimeout(graceTimer);
            connection.unbind('connected', onConnected);
            connection.unbind('state_change', onStateChange);
            window.Echo.leave(channelName);
            void channel;
        };
    }, [initial.board.id, replaceCard, triggerFlash]);

    const columnsSorted = useMemo(() => [...columns].sort(compareRank), [columns]);

    const visibleByColumn = useMemo(() => {
        const result: Record<string, string[]> = {};
        columnsSorted.forEach((column) => {
            result[column.id] = cards
                .filter((card) => card.columnId === column.id && matchesFilters(card, filters))
                .sort(compareRank)
                .map((card) => card.id);
        });
        return result;
    }, [cards, columnsSorted, filters]);

    const visibleCardsById = useMemo(() => {
        const map = new Map<string, Card>();
        cards.forEach((card) => {
            if (matchesFilters(card, filters)) map.set(card.id, card);
        });
        return map;
    }, [cards, filters]);

    const commentCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        cards.forEach((card) => {
            counts[card.id] = card.commentCount ?? 0;
        });
        return counts;
    }, [cards]);

    const labelsById = useMemo(() => new Map(labels.map((label) => [label.id, label])), [labels]);
    const usersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

    const orderedColumns = useMemo(() => {
        if (!columnPreview) return columnsSorted;
        const map = new Map(columnsSorted.map((column) => [column.id, column]));
        return columnPreview
            .map((id) => map.get(id))
            .filter((column): column is BoardColumn => Boolean(column));
    }, [columnsSorted, columnPreview]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const columnDroppableIds = useMemo(() => new Set(orderedColumns.map((column) => `column:${column.id}`)), [orderedColumns]);

    const collisionDetection = useCallback<CollisionDetection>(
        (args) => {
            const pointerCollisions = pointerWithin(args);
            const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
            if (activeDrag?.type === 'column') {
                return collisions.filter((collision) => columnDroppableIds.has(String(collision.id)));
            }
            return collisions;
        },
        [activeDrag?.type, columnDroppableIds],
    );

    function renderedCards(columnId: string): Card[] {
        const ids = cardPreview ? cardPreview[columnId] ?? [] : visibleByColumn[columnId] ?? [];
        return ids
            .map((id) => visibleCardsById.get(id))
            .filter((card): card is Card => Boolean(card));
    }

    function toggleAssignee(id: string) {
        setFilters((current) => ({
            ...current,
            assignees: current.assignees.includes(id)
                ? current.assignees.filter((item) => item !== id)
                : [...current.assignees, id],
        }));
    }

    function toggleLabel(id: string) {
        setFilters((current) => ({
            ...current,
            labels: current.labels.includes(id)
                ? current.labels.filter((item) => item !== id)
                : [...current.labels, id],
        }));
    }

    function setDue(value: DueFilter | null) {
        setFilters((current) => ({ ...current, due: value }));
    }

    function openCard(cardId: string) {
        if (didDragRef.current) return;
        setDrawerCardId(cardId);
        window.history.replaceState(window.history.state, '', `/boards/${initial.board.id}?card=${cardId}`);
    }

    function closeCard() {
        setDrawerCardId(null);
        window.history.replaceState(window.history.state, '', `/boards/${initial.board.id}`);
    }

    function resetPreview() {
        setActiveDrag(null);
        setCardPreview(null);
        setColumnPreview(null);
        setOverColumn(null);
        window.setTimeout(() => {
            didDragRef.current = false;
        }, 120);
    }

    function handleDragStart(event: DragStartEvent) {
        const type = event.active.data.current?.type as 'card' | 'column' | undefined;
        if (!type) return;
        didDragRef.current = true;
        const id = type === 'card'
            ? String(event.active.data.current?.cardId)
            : String(event.active.data.current?.columnId);
        setActiveDrag({ type, id });

        if (type === 'card') {
            const snapshot: Record<string, string[]> = {};
            columnsSorted.forEach((column) => {
                snapshot[column.id] = [...(visibleByColumn[column.id] ?? [])];
            });
            setCardPreview(snapshot);
            setColumnPreview(null);
        } else {
            setColumnPreview(columnsSorted.map((column) => column.id));
            setCardPreview(null);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        if (!activeDrag) return;
        const over = event.over;
        if (!over) {
            setOverColumn(null);
            return;
        }

        if (activeDrag.type === 'column') {
            setOverColumn(null);
            const overId = String(over.data.current?.columnId ?? '');
            if (!overId || overId === activeDrag.id) return;
            setColumnPreview((current) => {
                if (!current) return current;
                const from = current.indexOf(activeDrag.id);
                const to = current.indexOf(overId);
                if (from < 0 || to < 0) return current;
                return arrayMove(current, from, to);
            });
            return;
        }

        const overType = over.data.current?.type as 'card' | 'column' | undefined;
        let targetColumn: string | null = null;
        let targetIndex = 0;

        if (overType === 'card') {
            const overCardId = String(over.data.current?.cardId ?? '');
            if (!overCardId || overCardId === activeDrag.id) return;
            targetColumn = (over.data.current?.columnId as string | undefined) ?? null;
            if (!targetColumn) return;
            const destination = cardPreview?.[targetColumn] ?? [];
            targetIndex = destination.indexOf(overCardId);
            if (targetIndex < 0) return;
        } else if (overType === 'column') {
            targetColumn = String(over.data.current?.columnId ?? '');
            if (!targetColumn) return;
            targetIndex = cardPreview?.[targetColumn]?.length ?? 0;
        }

        if (!targetColumn) {
            setOverColumn(null);
            return;
        }

        setOverColumn(targetColumn);

        setCardPreview((current) => {
            if (!current) return current;
            const fromColumn = Object.keys(current).find((columnId) =>
                current[columnId].includes(activeDrag.id),
            );
            if (!fromColumn) return current;

            if (fromColumn === targetColumn) {
                const list = current[fromColumn];
                const fromIndex = list.indexOf(activeDrag.id);
                if (fromIndex === targetIndex) return current;
                return { ...current, [fromColumn]: arrayMove(list, fromIndex, targetIndex) };
            }

            const next: Record<string, string[]> = { ...current };
            next[fromColumn] = next[fromColumn].filter((id) => id !== activeDrag.id);
            const destination = [...(next[targetColumn] ?? [])];
            const index = Math.max(0, Math.min(targetIndex, destination.length));
            destination.splice(index, 0, activeDrag.id);
            next[targetColumn] = destination;
            return next;
        });
    }

    async function persistCardMove(
        cardId: string,
        targetColumn: string,
        rank: string,
        beforeCardId: string | null,
        afterCardId: string | null,
        snapshot: Card[],
    ) {
        setCards((current) =>
            current.map((card) => (card.id === cardId ? { ...card, columnId: targetColumn, rank } : card)),
        );

        try {
            const result = await moveCardRequest(cardId, {
                columnId: targetColumn,
                rank,
                beforeCardId,
                afterCardId,
            });
            replaceCard(result.card);
        } catch (error) {
            setCards(snapshot);
            toast.push(apiErrorMessage(error, 'Kartu gagal dipindahkan. Posisi dikembalikan.'), 'error');
        }
    }

    async function persistColumnMove(
        columnId: string,
        rank: string,
        beforeColumnId: string | null,
        afterColumnId: string | null,
        snapshot: BoardColumn[],
    ) {
        setColumns((current) =>
            current.map((column) => (column.id === columnId ? { ...column, rank } : column)),
        );

        try {
            const column = await moveColumnRequest(columnId, {
                rank,
                beforeColumnId,
                afterColumnId,
            });
            setColumns((current) => current.map((item) => (item.id === column.id ? column : item)));
        } catch (error) {
            setColumns(snapshot);
            toast.push(apiErrorMessage(error, 'Kolom gagal dipindahkan. Posisi dikembalikan.'), 'error');
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const active = activeDrag;
        if (!active) {
            resetPreview();
            return;
        }

        if (active.type === 'column' && columnPreview) {
            const originalOrder = columnsSorted.map((column) => column.id).join('|');
            if (columnPreview.join('|') !== originalOrder) {
                const index = columnPreview.indexOf(active.id);
                const previousId = columnPreview[index - 1] ?? null;
                const nextId = columnPreview[index + 1] ?? null;
                const previous = previousId
                    ? columns.find((column) => column.id === previousId)?.rank ?? null
                    : null;
                const next = nextId ? columns.find((column) => column.id === nextId)?.rank ?? null : null;

                try {
                    const rank = rankBetween(previous, next);
                    const snapshot = [...columns];
                    void persistColumnMove(active.id, rank, previousId, nextId, snapshot);
                } catch {
                    toast.push('Kolom gagal dipindahkan. Posisi dikembalikan.', 'error');
                }
            }
        }

        if (active.type === 'card' && cardPreview) {
            const cardId = active.id;
            const original = cards.find((card) => card.id === cardId);
            const finalColumn = Object.keys(cardPreview).find((columnId) =>
                cardPreview[columnId].includes(cardId),
            );

            if (original && finalColumn) {
                const list = cardPreview[finalColumn];
                const index = list.indexOf(cardId);
                const fullOthers = cards
                    .filter((card) => card.columnId === finalColumn && card.id !== cardId)
                    .sort(compareRank);
                const nextVisibleId = list.slice(index + 1).find((id) => id !== cardId);
                let insertAt = nextVisibleId
                    ? fullOthers.findIndex((card) => card.id === nextVisibleId)
                    : fullOthers.length;
                if (insertAt < 0) insertAt = fullOthers.length;

                const previous = fullOthers[insertAt - 1] ?? null;
                const next = fullOthers[insertAt] ?? null;
                const sameColumn = original.columnId === finalColumn;
                const currentFull = cards.filter((card) => card.columnId === original.columnId).sort(compareRank);
                const currentIndex = currentFull.findIndex((card) => card.id === cardId);
                const unchanged =
                    sameColumn &&
                    (currentFull[currentIndex - 1]?.id ?? null) === (previous?.id ?? null) &&
                    (currentFull[currentIndex + 1]?.id ?? null) === (next?.id ?? null);

                if (!unchanged) {
                    try {
                        const rank = rankBetween(previous?.rank ?? null, next?.rank ?? null);
                        const snapshot = [...cards];
                        void persistCardMove(
                            cardId,
                            finalColumn,
                            rank,
                            previous?.id ?? null,
                            next?.id ?? null,
                            snapshot,
                        );
                    } catch {
                        toast.push('Kartu gagal dipindahkan. Posisi dikembalikan.', 'error');
                    }
                }
            }
        }

        resetPreview();
    }

    async function createCard(columnId: string, title: string): Promise<boolean> {
        try {
            const card = await createCardRequest(String(initial.board.id), columnId, title);
            setCards((current) => [...current, card]);
            return true;
        } catch (error) {
            toast.push(apiErrorMessage(error, 'Kartu gagal dibuat. Coba lagi.'), 'error');
            return false;
        }
    }

    async function addColumn(name: string): Promise<boolean> {
        try {
            const column = await createColumnRequest(String(initial.board.id), name);
            setColumns((current) => [...current, column]);
            toast.push(`Kolom ${column.name} ditambahkan.`);
            return true;
        } catch (error) {
            toast.push(apiErrorMessage(error, 'Kolom gagal dibuat. Coba lagi.'), 'error');
            return false;
        }
    }

    function renameColumn(columnId: string, name: string) {
        void updateColumnRequest(columnId, name)
            .then((column) => {
                setColumns((current) => current.map((item) => (item.id === column.id ? column : item)));
            })
            .catch((error) => {
                toast.push(apiErrorMessage(error, 'Nama kolom gagal disimpan.'), 'error');
            });
    }

    const activeCard = activeDrag?.type === 'card'
        ? cards.find((card) => card.id === activeDrag.id) ?? null
        : null;
    const activeColumn = activeDrag?.type === 'column'
        ? columns.find((column) => column.id === activeDrag.id) ?? null
        : null;

    const drawerCard = drawerCardId ? cards.find((card) => card.id === drawerCardId) ?? null : null;

    return (
        <>
            <Head title={initial.board.name}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
                <BoardTopBar
                    board={initial.board}
                    activeSprint={activeSprint}
                    members={members}
                    presenceUsers={presenceUsers}
                    labels={labels}
                    filters={filters}
                    onToggleAssignee={toggleAssignee}
                    onToggleLabel={toggleLabel}
                    onSetDue={setDue}
                    onReset={() => setFilters(emptyFilters)}
                />

                {connectionState === 'disconnected' ? (
                    <div
                        role="status"
                        className="flex items-center gap-2 border-b border-danger/30 bg-danger/10 px-4 py-2 text-xs text-danger-soft"
                    >
                        <WifiOff size={13} aria-hidden="true" />
                        Koneksi terputus, mencoba menyambung ulang
                    </div>
                ) : null}

                {loading ? (
                    <BoardSkeleton />
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={collisionDetection}
                        autoScroll={{ threshold: { x: 0.05, y: 0.05 } }}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={resetPreview}
                    >
                        <div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto overflow-y-hidden px-3 py-3 sm:px-4">
                            <SortableContext
                                items={orderedColumns.map((column) => `column:${column.id}`)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {orderedColumns.map((column) => (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        cards={renderedCards(column.id)}
                                        labelsById={labelsById}
                                        usersById={usersById}
                                        commentCounts={commentCounts}
                                        activeSprintId={activeSprint?.id ?? null}
                                        filtered={isFilterActive(filters)}
                                        highlighted={overColumn === column.id}
                                        flashCardId={flashCardId}
                                        onOpenCard={openCard}
                                        onRenameColumn={renameColumn}
                                        onCreateCard={createCard}
                                    />
                                ))}
                            </SortableContext>
                            <AddColumn onAdd={addColumn} />
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {activeCard ? (
                                <div className="w-[284px]">
                                    <KanbanCardView
                                        card={activeCard}
                                        labels={activeCard.labelIds
                                            .map((id) => labelsById.get(id))
                                            .filter((label): label is Label => Boolean(label))}
                                        assignee={
                                            activeCard.assigneeId
                                                ? usersById.get(activeCard.assigneeId) ?? null
                                                : null
                                        }
                                        commentCount={commentCounts[activeCard.id] ?? 0}
                                        inSprint={Boolean(activeSprint && activeCard.sprintId === activeSprint.id)}
                                        overlay
                                    />
                                </div>
                            ) : activeColumn ? (
                                <div className="flex h-10 w-[300px] items-center rounded-column border border-hairline bg-surface px-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-paper shadow-drag">
                                    {activeColumn.name}
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                <CardDrawer
                    cardId={drawerCardId}
                    baseCard={drawerCard}
                    boardId={String(initial.board.id)}
                    boardName={initial.board.name}
                    members={members}
                    labels={labels}
                    activeSprint={activeSprint}
                    currentUser={currentUser}
                    refreshKey={drawerRefreshKey}
                    incomingComment={liveComment}
                    incomingActivity={liveActivity}
                    onClose={closeCard}
                    onCardLoaded={replaceCard}
                    onCardUpdated={replaceCard}
                    onCommentCount={(cardId, count) =>
                        setCards((current) =>
                            current.map((card) => (card.id === cardId ? { ...card, commentCount: count } : card)),
                        )
                    }
                />
            </div>
        </>
    );
}

export default Object.assign(BoardPage, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
