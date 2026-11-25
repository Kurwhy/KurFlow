import { generateKeyBetween } from 'fractional-indexing';

export function rankBetween(before: string | null, after: string | null): string {
    return generateKeyBetween(before, after);
}

export function rankAfter(last: string | null): string {
    return generateKeyBetween(last, null);
}

export function compareRank(a: { rank: string }, b: { rank: string }): number {
    return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0;
}
