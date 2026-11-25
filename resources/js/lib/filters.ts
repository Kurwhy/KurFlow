import type { Card } from '@/types/kurflow';
import { dueStatus, isWithinNextSevenDays } from '@/lib/format';

export type DueFilter = 'overdue' | 'today' | 'next7' | 'none';

export interface FilterState {
    assignees: string[];
    labels: string[];
    due: DueFilter | null;
}

export const emptyFilters: FilterState = { assignees: [], labels: [], due: null };

export const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
    { value: 'overdue', label: 'Lewat tenggat' },
    { value: 'today', label: 'Hari ini' },
    { value: 'next7', label: '7 hari ke depan' },
    { value: 'none', label: 'Tanpa due date' },
];

export function isFilterActive(filters: FilterState): boolean {
    return filters.assignees.length > 0 || filters.labels.length > 0 || filters.due !== null;
}

export function countActiveFilters(filters: FilterState): number {
    return (
        filters.assignees.length +
        filters.labels.length +
        (filters.due ? 1 : 0)
    );
}

export function matchesFilters(card: Card, filters: FilterState): boolean {
    if (filters.assignees.length > 0) {
        const matched = card.assigneeId
            ? filters.assignees.includes(card.assigneeId)
            : filters.assignees.includes('unassigned');
        if (!matched) return false;
    }

    if (filters.labels.length > 0) {
        if (!card.labelIds.some((labelId) => filters.labels.includes(labelId))) {
            return false;
        }
    }

    if (filters.due) {
        const status = dueStatus(card.dueDate);
        if (filters.due === 'none' && card.dueDate) return false;
        if (filters.due === 'overdue' && status !== 'overdue') return false;
        if (filters.due === 'today' && status !== 'today') return false;
        if (filters.due === 'next7' && !isWithinNextSevenDays(card.dueDate)) return false;
    }

    return true;
}
