import { Head, Link } from '@inertiajs/react';
import { CalendarRange, Check, Play } from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge';
import { useToast } from '@/components/ui/Toast';
import { AppLayout } from '@/layouts/AppLayout';
import {
    apiErrorMessage,
    completeSprintRequest,
    createSprintRequest,
    mapSprint,
    startSprintRequest,
} from '@/lib/api';
import { formatDate, formatDateRange } from '@/lib/format';
import type { Sprint } from '@/types/kurflow';

interface SprintRow extends Sprint {
    cardsCount: number;
}

interface Props {
    board: { id: number; name: string };
    workspace: { id: number; name: string };
    sprints: Record<string, any>[];
    activeSprintId: number | null;
}

function SprintBoard({ board, sprints: rawSprints, activeSprintId }: Props) {
    const toast = useToast();
    const initialSprints = useMemo<SprintRow[]>(
        () =>
            rawSprints
                .map((raw) => {
                    const sprint = mapSprint(raw);
                    return sprint ? { ...sprint, cardsCount: Number(raw.cards_count ?? 0) } : null;
                })
                .filter((sprint): sprint is SprintRow => Boolean(sprint))
                .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0)),
        [rawSprints],
    );
    const [sprints, setSprints] = useState<SprintRow[]>(initialSprints);
    const [activeId, setActiveId] = useState<string | null>(
        activeSprintId ? String(activeSprintId) : null,
    );
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errors, setErrors] = useState<{ name?: string; startDate?: string; endDate?: string }>({});
    const [formError, setFormError] = useState<string | undefined>();
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const nameId = useFieldId('sprint-name');
    const startId = useFieldId('sprint-start');
    const endId = useFieldId('sprint-end');

    const activeSprint = sprints.find((sprint) => sprint.id === activeId) ?? null;
    const hasActive = activeId !== null;

    async function createSprint(event: FormEvent) {
        event.preventDefault();
        const nextErrors: typeof errors = {};
        const trimmed = name.trim();
        if (trimmed.length < 3 || trimmed.length > 60) {
            nextErrors.name = 'Nama sprint wajib diisi, 3 sampai 60 karakter.';
        }
        if (!startDate) nextErrors.startDate = 'Tanggal mulai wajib diisi.';
        if (!endDate) nextErrors.endDate = 'Tanggal selesai wajib diisi.';
        if (startDate && endDate && endDate < startDate) {
            nextErrors.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
        }
        setErrors(nextErrors);
        setFormError(undefined);
        if (Object.keys(nextErrors).length > 0) return;

        setCreating(true);
        try {
            const sprint = await createSprintRequest(String(board.id), {
                name: trimmed,
                startDate,
                endDate,
            });
            setSprints((current) =>
                [{ ...sprint, cardsCount: 0 }, ...current].sort((a, b) =>
                    a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0,
                ),
            );
            setName('');
            setStartDate('');
            setEndDate('');
            toast.push(`${sprint.name} dibuat. Jalankan sprint saat siap.`);
        } catch (caught) {
            const message = apiErrorMessage(caught, 'Sprint gagal dibuat. Coba lagi.');
            setFormError(message);
            toast.push(message, 'error');
        } finally {
            setCreating(false);
        }
    }

    async function startSprint(sprint: SprintRow) {
        if (hasActive) {
            toast.push('Selesaikan sprint aktif terlebih dahulu.', 'error');
            return;
        }
        setBusyId(sprint.id);
        try {
            const updated = await startSprintRequest(sprint.id);
            setSprints((current) =>
                current.map((item) => (item.id === sprint.id ? { ...item, ...updated } : item)),
            );
            setActiveId(updated.id);
            toast.push(`${updated.name} berjalan.`);
        } catch (caught) {
            toast.push(apiErrorMessage(caught, 'Sprint gagal dijalankan.'), 'error');
        } finally {
            setBusyId(null);
        }
    }

    async function completeSprint(sprint: SprintRow) {
        setBusyId(sprint.id);
        try {
            const updated = await completeSprintRequest(sprint.id);
            setSprints((current) =>
                current.map((item) => (item.id === sprint.id ? { ...item, ...updated } : item)),
            );
            setActiveId(null);
            toast.push(`${updated.name} selesai.`);
        } catch (caught) {
            toast.push(apiErrorMessage(caught, 'Sprint gagal diselesaikan.'), 'error');
        } finally {
            setBusyId(null);
        }
    }

    return (
        <>
            <Head title={`Sprint ${board.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 lg:px-8">
                <p className="text-xs text-muted">
                    <Link href={`/boards/${board.id}`} className="hover:text-paper">
                        {board.name}
                    </Link>
                    <span aria-hidden="true"> / </span>
                    <span className="text-muted">Sprint</span>
                </p>
                <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-paper">
                            Sprint
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                            {activeSprint
                                ? `${activeSprint.name} sedang berjalan, ${formatDateRange(activeSprint.startDate, activeSprint.endDate)}.`
                                : 'Belum ada sprint aktif di board ini.'}
                        </p>
                    </div>
                    <Link
                        href={`/boards/${board.id}`}
                        className="inline-flex min-h-9 items-center text-[13px] text-gold-300 underline-offset-4 hover:underline max-sm:min-h-11"
                    >
                        Kembali ke board
                    </Link>
                </header>

                <section className="mt-8 rounded-panel border border-hairline p-5">
                    <h2 className="text-[15px] font-semibold text-paper">Buat sprint</h2>
                    <p className="mt-1 text-[13px] text-muted">
                        Sprint baru berstatus direncanakan. Jalankan saat siap dikerjakan.
                    </p>
                    <form onSubmit={createSprint} noValidate className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px_150px_auto] sm:items-end">
                        <Field label="Nama sprint" htmlFor={nameId} error={errors.name}>
                            <Input
                                id={nameId}
                                value={name}
                                placeholder="Sprint 16"
                                invalid={Boolean(errors.name)}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </Field>
                        <Field label="Tanggal mulai" htmlFor={startId} error={errors.startDate}>
                            <Input
                                id={startId}
                                type="date"
                                value={startDate}
                                invalid={Boolean(errors.startDate)}
                                onChange={(event) => setStartDate(event.target.value)}
                            />
                        </Field>
                        <Field label="Tanggal selesai" htmlFor={endId} error={errors.endDate}>
                            <Input
                                id={endId}
                                type="date"
                                value={endDate}
                                invalid={Boolean(errors.endDate)}
                                onChange={(event) => setEndDate(event.target.value)}
                            />
                        </Field>
                        <Button type="submit" variant="primary" disabled={creating}>
                            {creating ? 'Menyimpan...' : 'Buat Sprint'}
                        </Button>
                    </form>
                    {formError ? (
                        <p role="alert" className="mt-2 text-xs text-danger-soft">
                            {formError}
                        </p>
                    ) : null}
                </section>

                <section aria-label="Daftar sprint" className="mt-8">
                    {sprints.length === 0 ? (
                        <div className="rounded-panel border border-hairline">
                            <EmptyState
                                icon={<CalendarRange size={18} aria-hidden="true" />}
                                title="Belum ada sprint"
                                description="Buat sprint pertama untuk mengelompokkan kartu yang dikerjakan tim."
                            />
                        </div>
                    ) : (
                        <ul className="overflow-hidden rounded-panel border border-hairline">
                            {sprints.map((sprint) => {
                                const canStart = !hasActive;
                                return (
                                    <li key={sprint.id} className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium text-paper">{sprint.name}</p>
                                                <SprintStatusBadge status={sprint.status} />
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted tnum">
                                                {formatDateRange(sprint.startDate, sprint.endDate)} · {sprint.cardsCount} kartu
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {sprint.status === 'direncanakan' ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={!canStart || busyId === sprint.id}
                                                    title={canStart ? undefined : 'Selesaikan sprint aktif terlebih dahulu.'}
                                                    onClick={() => startSprint(sprint)}
                                                >
                                                    <Play size={13} aria-hidden="true" />
                                                    {busyId === sprint.id ? 'Menjalankan...' : 'Jalankan Sprint'}
                                                </Button>
                                            ) : null}
                                            {sprint.status === 'aktif' ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={busyId === sprint.id}
                                                    onClick={() => completeSprint(sprint)}
                                                >
                                                    <Check size={13} aria-hidden="true" />
                                                    {busyId === sprint.id ? 'Menyelesaikan...' : 'Selesaikan Sprint'}
                                                </Button>
                                            ) : null}
                                            {sprint.status === 'selesai' ? (
                                                <p className="text-[11px] text-muted tnum">
                                                    Selesai {formatDate(sprint.endDate)}
                                                </p>
                                            ) : null}
                                            {sprint.status === 'direncanakan' && hasActive ? (
                                                <p className="text-[11px] text-muted">
                                                    Selesaikan sprint aktif terlebih dahulu.
                                                </p>
                                            ) : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

export default Object.assign(SprintBoard, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
