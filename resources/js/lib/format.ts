import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { LabelColor } from '@/types/kurflow';

export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

export function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export function todayInJakarta(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

export function formatDate(value: string | null | undefined): string {
    if (!value) return '';
    return format(parseISO(value), 'd MMM yyyy', { locale: localeId });
}

export function formatShortDay(value: string): string {
    return format(parseISO(value), 'd MMM', { locale: localeId });
}

export function formatDateRange(start: string, end: string): string {
    const startYear = format(parseISO(start), 'yyyy');
    const endYear = format(parseISO(end), 'yyyy');
    if (startYear === endYear) {
        return `${formatShortDay(start)} - ${format(parseISO(end), 'd MMM yyyy', { locale: localeId })}`;
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
}

export function formatDateTime(value: string): string {
    const date = new Date(value);
    const datePart = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    }).format(date);
    const timePart = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    })
        .format(date)
        .replace(':', '.');
    return `${datePart} ${timePart}`;
}

export function formatTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    })
        .format(new Date(value))
        .replace(':', '.');
}

export type DueStatus = 'overdue' | 'today' | 'upcoming';

export function dueStatus(value: string | null): DueStatus | null {
    if (!value) return null;
    const today = todayInJakarta();
    if (value < today) return 'overdue';
    if (value === today) return 'today';
    return 'upcoming';
}

export function addDays(isoDate: string, days: number): string {
    const date = new Date(`${isoDate}T00:00:00`);
    date.setDate(date.getDate() + days);
    return format(date, 'yyyy-MM-dd');
}

export function isWithinNextSevenDays(value: string | null): boolean {
    if (!value) return false;
    const today = todayInJakarta();
    return value >= today && value <= addDays(today, 7);
}

export function labelColorClass(color: LabelColor): string {
    const map: Record<LabelColor, string> = {
        '#E5484D': 'bg-tag-red',
        '#F59E0B': 'bg-tag-orange',
        '#D4AF37': 'bg-tag-gold',
        '#10B981': 'bg-tag-green',
        '#3E9BD6': 'bg-tag-blue',
        '#A07CDB': 'bg-tag-lavender',
    };
    return map[color];
}

export function pluralize(count: number, singular: string, plural?: string): string {
    return `${count} ${count === 1 ? singular : (plural ?? singular)}`;
}
