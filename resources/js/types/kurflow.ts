export type SprintStatus = 'direncanakan' | 'aktif' | 'selesai';

export type LabelColor =
    | '#E5484D'
    | '#F59E0B'
    | '#D4AF37'
    | '#10B981'
    | '#3E9BD6'
    | '#A07CDB';

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface Workspace {
    id: string;
    ownerId: string;
    name: string;
}

export interface Board {
    id: string;
    workspaceId: string;
    name: string;
}

export interface BoardColumn {
    id: string;
    boardId: string;
    name: string;
    rank: string;
}

export interface Sprint {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: SprintStatus;
}

export interface Label {
    id: string;
    boardId: string;
    name: string;
    color: LabelColor;
}

export interface Card {
    id: string;
    boardId: string;
    columnId: string;
    sprintId: string | null;
    assigneeId: string | null;
    createdBy: string;
    title: string;
    dueDate: string | null;
    rank: string;
    labelIds: string[];
    commentCount?: number;
    creator?: User;
    assignee?: User;
}

export interface CardComment {
    id: string;
    cardId: string;
    body: string;
    createdAt: string;
    user: User;
}

export interface CardActivity {
    id: string;
    cardId: string;
    fromColumnName: string;
    toColumnName: string;
    createdAt: string;
    user: User;
}

export interface NavigationBoard {
    id: string;
    name: string;
    hasActiveSprint: boolean;
}

export interface NavigationWorkspace {
    id: string;
    name: string;
    boards: NavigationBoard[];
}

export interface SharedProps extends Record<string, unknown> {
    auth: { user: User | null };
    navigation: { workspaces: NavigationWorkspace[] };
    flash: { success?: string | null; error?: string | null };
}

export const LABEL_COLORS: { value: LabelColor; name: string }[] = [
    { value: '#E5484D', name: 'Merah' },
    { value: '#F59E0B', name: 'Oranye' },
    { value: '#D4AF37', name: 'Gold' },
    { value: '#10B981', name: 'Hijau' },
    { value: '#3E9BD6', name: 'Biru laut' },
    { value: '#A07CDB', name: 'Lavender' },
];
