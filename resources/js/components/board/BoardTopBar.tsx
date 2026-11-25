import { Link } from '@inertiajs/react';
import { Calendar, CalendarRange, Check, Settings2, Tag, UserRound, X } from 'lucide-react';
import type { Board, Label, Sprint, User } from '@/types/kurflow';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverPanel, PopoverTrigger } from '@/components/ui/Popover';
import { formatDateRange } from '@/lib/format';
import {
    countActiveFilters,
    DUE_OPTIONS,
    isFilterActive,
    type DueFilter,
    type FilterState,
} from '@/lib/filters';

interface BoardTopBarProps {
    board: Board;
    activeSprint: Sprint | null;
    members: User[];
    presenceUsers: User[];
    labels: Label[];
    filters: FilterState;
    onToggleAssignee: (id: string) => void;
    onToggleLabel: (id: string) => void;
    onSetDue: (value: DueFilter | null) => void;
    onReset: () => void;
}

function FilterCheck({ checked }: { checked: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                checked ? 'border-gold-400 bg-gold-400 text-[#141414]' : 'border-hairline'
            }`}
        >
            {checked ? <Check size={10} strokeWidth={3} /> : null}
        </span>
    );
}

function FilterTrigger({
    label,
    icon,
    active,
    count,
}: {
    label: string;
    icon: React.ReactNode;
    active: boolean;
    count: number;
}) {
    return (
        <PopoverTrigger asChild>
            <Button
                variant="secondary"
                size="sm"
                aria-label={`Filter ${label}`}
                className={active ? 'border-gold-400/40 text-paper' : undefined}
            >
                {icon}
                <span className="hidden sm:inline">{label}</span>
                {count > 0 ? (
                    <span className="hidden h-4 min-w-4 items-center justify-center rounded-[3px] bg-gold-400 px-1 text-[10px] font-semibold text-[#141414] tnum sm:inline-flex">
                        {count}
                    </span>
                ) : null}
            </Button>
        </PopoverTrigger>
    );
}

export function BoardTopBar({
    board,
    activeSprint,
    members,
    presenceUsers,
    labels,
    filters,
    onToggleAssignee,
    onToggleLabel,
    onSetDue,
    onReset,
}: BoardTopBarProps) {
    const active = isFilterActive(filters);
    const totalActive = countActiveFilters(filters);

    return (
        <header className="sticky top-0 z-20 border-b border-hairline bg-ink">
            <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                    <h1 className="truncate text-sm font-semibold text-paper">{board.name}</h1>
                    <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-hairline sm:block" />
                    {activeSprint ? (
                        <span className="flex min-w-0 items-center gap-1.5">
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border border-emerald/30 bg-emerald/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-emerald">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald" />
                                {activeSprint.name}
                            </span>
                            <span className="hidden truncate text-xs text-muted tnum sm:inline">
                                {formatDateRange(activeSprint.startDate, activeSprint.endDate)}
                            </span>
                        </span>
                    ) : (
                        <span className="shrink-0 text-xs text-muted">Tidak ada sprint aktif</span>
                    )}
                    <div className="ml-auto sm:hidden">
                        <AvatarStack
                            users={presenceUsers}
                            max={5}
                            onlineUserIds={presenceUsers.map((user) => user.id)}
                        />
                    </div>
                </div>

                <div className="flex w-full items-center gap-1.5 sm:w-auto">
                    <Popover>
                        <FilterTrigger
                            label="Assignee"
                            icon={<UserRound size={13} aria-hidden="true" />}
                            active={filters.assignees.length > 0}
                            count={filters.assignees.length}
                        />
                        <PopoverPanel>
                            <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">Assignee</p>
                            <div className="max-h-64 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => onToggleAssignee('unassigned')}
                                    aria-pressed={filters.assignees.includes('unassigned')}
                                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-paper hover:bg-white/[0.04] max-sm:py-3"
                                >
                                    <FilterCheck checked={filters.assignees.includes('unassigned')} />
                                    <span className="text-muted">Belum ditugaskan</span>
                                </button>
                                {members.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => onToggleAssignee(member.id)}
                                        aria-pressed={filters.assignees.includes(member.id)}
                                        className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-paper hover:bg-white/[0.04] max-sm:py-3"
                                    >
                                        <FilterCheck checked={filters.assignees.includes(member.id)} />
                                        <Avatar name={member.name} avatarUrl={member.avatarUrl} size="xs" />
                                        <span className="truncate">{member.name}</span>
                                    </button>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <Popover>
                        <FilterTrigger
                            label="Label"
                            icon={<Tag size={13} aria-hidden="true" />}
                            active={filters.labels.length > 0}
                            count={filters.labels.length}
                        />
                        <PopoverPanel>
                            <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">Label</p>
                            {labels.length === 0 ? (
                                <p className="px-2 py-2 text-[13px] leading-relaxed text-muted">
                                    Belum ada label di board ini.{' '}
                                    <Link
                                        href={`/boards/${board.id}/settings`}
                                        className="text-gold-300 underline-offset-4 hover:underline"
                                    >
                                        Buat label
                                    </Link>
                                </p>
                            ) : (
                                <div className="max-h-64 overflow-y-auto">
                                    {labels.map((label) => (
                                        <button
                                            key={label.id}
                                            type="button"
                                            onClick={() => onToggleLabel(label.id)}
                                            aria-pressed={filters.labels.includes(label.id)}
                                            className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-paper hover:bg-white/[0.04] max-sm:py-3"
                                        >
                                            <FilterCheck checked={filters.labels.includes(label.id)} />
                                            <span
                                                aria-hidden="true"
                                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: label.color }}
                                            />
                                            <span className="truncate">{label.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </PopoverPanel>
                    </Popover>

                    <Popover>
                        <FilterTrigger
                            label="Due date"
                            icon={<Calendar size={13} aria-hidden="true" />}
                            active={filters.due !== null}
                            count={filters.due ? 1 : 0}
                        />
                        <PopoverPanel>
                            <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">Due date</p>
                            {DUE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onSetDue(filters.due === option.value ? null : option.value)}
                                    aria-pressed={filters.due === option.value}
                                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-paper hover:bg-white/[0.04] max-sm:py-3"
                                >
                                    <FilterCheck checked={filters.due === option.value} />
                                    {option.label}
                                </button>
                            ))}
                        </PopoverPanel>
                    </Popover>

                    {active ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            aria-label={`Reset filter, ${totalActive} filter aktif`}
                            className="max-sm:w-11 max-sm:justify-center max-sm:px-0"
                        >
                            <X size={13} aria-hidden="true" />
                            <span className="hidden sm:inline">Reset filter</span>
                        </Button>
                    ) : null}

                    <span aria-hidden="true" className="mx-0.5 hidden h-4 w-px bg-hairline sm:block" />

                    <Link
                        href={`/boards/${board.id}/sprints`}
                        aria-label="Buka halaman sprint"
                        title="Sprint"
                        className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-hairline px-2.5 text-[13px] text-paper transition-colors duration-150 hover:border-hairline-hover hover:bg-white/[0.03] max-sm:h-11 max-sm:w-11 max-sm:justify-center max-sm:px-0"
                    >
                        <CalendarRange size={14} aria-hidden="true" />
                        <span className="hidden sm:inline">Sprint</span>
                    </Link>
                    <Link
                        href={`/boards/${board.id}/settings`}
                        aria-label="Buka pengaturan board"
                        title="Pengaturan"
                        className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-hairline px-2.5 text-[13px] text-paper transition-colors duration-150 hover:border-hairline-hover hover:bg-white/[0.03] max-sm:h-11 max-sm:w-11 max-sm:justify-center max-sm:px-0"
                    >
                        <Settings2 size={14} aria-hidden="true" />
                        <span className="hidden sm:inline">Pengaturan</span>
                    </Link>

                    <div className="ml-0.5 hidden sm:block">
                        <AvatarStack
                            users={presenceUsers}
                            max={5}
                            onlineUserIds={presenceUsers.map((user) => user.id)}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
