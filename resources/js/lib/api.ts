import axios from 'axios';
import type {
    Board,
    BoardColumn,
    Card,
    CardActivity,
    CardComment,
    Label,
    LabelColor,
    Sprint,
    User,
} from '@/types/kurflow';

type Raw = Record<string, any>;

export function mapUser(raw: Raw | null | undefined): User {
    return {
        id: String(raw?.id ?? ''),
        name: String(raw?.name ?? ''),
        email: String(raw?.email ?? ''),
        avatarUrl: raw?.avatar_url ?? undefined,
    };
}

export function mapLabel(raw: Raw): Label {
    return {
        id: String(raw.id),
        boardId: String(raw.board_id),
        name: raw.name,
        color: raw.color as LabelColor,
    };
}

export function mapColumn(raw: Raw): BoardColumn {
    return {
        id: String(raw.id),
        boardId: String(raw.board_id),
        name: raw.name,
        rank: raw.rank,
    };
}

export function mapSprint(raw: Raw | null | undefined): Sprint | null {
    if (!raw) return null;
    return {
        id: String(raw.id),
        name: raw.name,
        startDate: raw.start_date,
        endDate: raw.end_date,
        status: raw.status,
    };
}

export function mapCard(raw: Raw): Card {
    return {
        id: String(raw.id),
        boardId: String(raw.board_id),
        columnId: String(raw.column_id),
        sprintId: raw.sprint_id ? String(raw.sprint_id) : null,
        assigneeId: raw.assignee_id ? String(raw.assignee_id) : null,
        createdBy: String(raw.created_by),
        title: raw.title,
        dueDate: raw.due_date ?? null,
        rank: raw.rank,
        labelIds: (raw.label_ids ?? []).map((id: number | string) => String(id)),
        commentCount: Number(raw.comment_count ?? 0),
        creator: raw.creator ? mapUser(raw.creator) : undefined,
        assignee: raw.assignee ? mapUser(raw.assignee) : undefined,
    };
}

export function mapComment(raw: Raw): CardComment {
    return {
        id: String(raw.id),
        cardId: String(raw.card_id),
        body: raw.body,
        createdAt: raw.created_at,
        user: mapUser(raw.user),
    };
}

export function mapActivity(raw: Raw): CardActivity {
    return {
        id: String(raw.id),
        cardId: String(raw.card_id),
        fromColumnName: raw.from_column_name,
        toColumnName: raw.to_column_name,
        createdAt: raw.created_at,
        user: mapUser(raw.user),
    };
}

export function mapBoard(raw: Raw): Board {
    return { id: String(raw.id), workspaceId: String(raw.workspace_id), name: raw.name };
}

export interface BoardState {
    board: Board;
    workspace: { id: string; name: string; ownerId: string };
    columns: BoardColumn[];
    cards: Card[];
    labels: Label[];
    members: User[];
    activeSprint: Sprint | null;
}

export interface RawBoardState {
    board: Raw;
    workspace: Raw;
    columns: Raw[];
    cards: Raw[];
    labels: Raw[];
    members: Raw[];
    activeSprint: Raw | null;
}

export function mapBoardState(raw: RawBoardState): BoardState {
    return {
        board: mapBoard(raw.board),
        workspace: {
            id: String(raw.workspace.id),
            name: raw.workspace.name,
            ownerId: String(raw.workspace.owner_id),
        },
        columns: raw.columns.map(mapColumn),
        cards: raw.cards.map(mapCard),
        labels: raw.labels.map(mapLabel),
        members: raw.members.map(mapUser),
        activeSprint: mapSprint(raw.activeSprint),
    };
}

export function apiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as Raw | undefined;
        const errors = data?.errors as Record<string, string[]> | undefined;
        if (errors) {
            const first = Object.values(errors)[0];
            if (Array.isArray(first) && first[0]) return first[0];
        }
        if (typeof data?.message === 'string' && data.message && data.message !== 'The given data was invalid.') {
            return data.message;
        }
        if (error.response?.status === 403) return 'Anda tidak punya akses ke aksi ini.';
        if (error.response?.status === 419) return 'Sesi Anda berakhir. Muat ulang halaman.';
    }

    return fallback;
}

export async function createColumnRequest(boardId: string, name: string): Promise<BoardColumn> {
    const response = await axios.post(`/api/boards/${boardId}/columns`, { name });
    return mapColumn(response.data.column);
}

export async function updateColumnRequest(columnId: string, name: string): Promise<BoardColumn> {
    const response = await axios.patch(`/api/columns/${columnId}`, { name });
    return mapColumn(response.data.column);
}

export async function moveColumnRequest(
    columnId: string,
    payload: { rank: string; beforeColumnId: string | null; afterColumnId: string | null },
): Promise<BoardColumn> {
    const response = await axios.patch(`/api/columns/${columnId}/move`, {
        rank: payload.rank,
        before_column_id: payload.beforeColumnId,
        after_column_id: payload.afterColumnId,
    });
    return mapColumn(response.data.column);
}

export async function createCardRequest(
    boardId: string,
    columnId: string,
    title: string,
): Promise<Card> {
    const response = await axios.post(`/api/boards/${boardId}/cards`, {
        column_id: columnId,
        title,
    });
    return mapCard(response.data.card);
}

export interface CardUpdatePayload {
    title?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    labelIds?: string[];
    sprintId?: string | null;
}

export async function updateCardRequest(cardId: string, payload: CardUpdatePayload): Promise<Card> {
    const body: Raw = {};
    if (payload.title !== undefined) body.title = payload.title;
    if (payload.assigneeId !== undefined) body.assignee_id = payload.assigneeId;
    if (payload.dueDate !== undefined) body.due_date = payload.dueDate;
    if (payload.labelIds !== undefined) body.label_ids = payload.labelIds;
    if (payload.sprintId !== undefined) body.sprint_id = payload.sprintId;

    const response = await axios.patch(`/api/cards/${cardId}`, body);
    return mapCard(response.data.card);
}

export async function moveCardRequest(
    cardId: string,
    payload: {
        columnId: string;
        rank: string;
        beforeCardId: string | null;
        afterCardId: string | null;
    },
): Promise<{ card: Card; activity: CardActivity | null; rank: string }> {
    const response = await axios.patch(`/api/cards/${cardId}/move`, {
        column_id: payload.columnId,
        rank: payload.rank,
        before_card_id: payload.beforeCardId,
        after_card_id: payload.afterCardId,
    });

    return {
        card: mapCard(response.data.card),
        activity: response.data.activity ? mapActivity(response.data.activity) : null,
        rank: response.data.rank,
    };
}

export interface CardDetail {
    card: Card;
    comments: CardComment[];
    activities: CardActivity[];
}

export async function fetchCardRequest(cardId: string): Promise<CardDetail> {
    const response = await axios.get(`/api/cards/${cardId}`);
    return {
        card: mapCard(response.data.card),
        comments: (response.data.comments ?? []).map(mapComment),
        activities: (response.data.activities ?? []).map(mapActivity),
    };
}

export async function createCommentRequest(
    cardId: string,
    body: string,
): Promise<{ comment: CardComment; commentCount: number }> {
    const response = await axios.post(`/api/cards/${cardId}/comments`, { body });
    return {
        comment: mapComment(response.data.comment),
        commentCount: Number(response.data.comment_count ?? 0),
    };
}

export async function fetchBoardStateRequest(boardId: string): Promise<BoardState> {
    const response = await axios.get(`/api/boards/${boardId}/state`);
    return mapBoardState(response.data as RawBoardState);
}

export async function createSprintRequest(
    boardId: string,
    payload: { name: string; startDate: string; endDate: string },
): Promise<Sprint> {
    const response = await axios.post(`/api/boards/${boardId}/sprints`, {
        name: payload.name,
        start_date: payload.startDate,
        end_date: payload.endDate,
    });
    const sprint = mapSprint(response.data.sprint);
    if (!sprint) throw new Error('Sprint tidak valid.');
    return sprint;
}

export async function startSprintRequest(sprintId: string): Promise<Sprint> {
    const response = await axios.post(`/api/sprints/${sprintId}/start`);
    const sprint = mapSprint(response.data.sprint);
    if (!sprint) throw new Error('Sprint tidak valid.');
    return sprint;
}

export async function completeSprintRequest(sprintId: string): Promise<Sprint> {
    const response = await axios.post(`/api/sprints/${sprintId}/complete`);
    const sprint = mapSprint(response.data.sprint);
    if (!sprint) throw new Error('Sprint tidak valid.');
    return sprint;
}
