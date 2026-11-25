import { Head, Link, useForm } from '@inertiajs/react';
import { Settings, Tags, UserRound, Users } from 'lucide-react';
import { FormEvent, ReactNode, useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { AppLayout } from '@/layouts/AppLayout';
import { mapLabel, mapUser } from '@/lib/api';
import { LABEL_COLORS, type Label, type LabelColor, type User } from '@/types/kurflow';

interface Props {
    board: { id: number; name: string };
    workspace: { id: number; name: string; owner_id: number };
    isOwner: boolean;
    members: Record<string, any>[];
    labels: Record<string, any>[];
}

function BoardSettings({ board, workspace, isOwner, members: rawMembers, labels: rawLabels }: Props) {
    const members = useMemo<User[]>(() => rawMembers.map(mapUser), [rawMembers]);
    const labels = useMemo<Label[]>(() => rawLabels.map(mapLabel), [rawLabels]);
    const boardNameId = useFieldId('settings-board-name');
    const memberId = useFieldId('settings-member-email');
    const labelId = useFieldId('settings-label-name');

    const renameForm = useForm({ name: board.name });
    const memberForm = useForm({ email: '' });
    const labelForm = useForm({ name: '', color: '#E5484D' as LabelColor });

    const selectedColorName = LABEL_COLORS.find((color) => color.value === labelForm.data.color)?.name ?? '';

    function renameBoard(event: FormEvent) {
        event.preventDefault();
        renameForm.patch(`/boards/${board.id}`, { preserveScroll: true });
    }

    function addMember(event: FormEvent) {
        event.preventDefault();
        memberForm.post(`/boards/${board.id}/members`, {
            preserveScroll: true,
            onSuccess: () => memberForm.reset('email'),
        });
    }

    function createLabel(event: FormEvent) {
        event.preventDefault();
        labelForm.post(`/boards/${board.id}/labels`, {
            preserveScroll: true,
            onSuccess: () => labelForm.reset('name'),
        });
    }

    return (
        <>
            <Head title={`Pengaturan ${board.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 lg:px-8">
                <p className="text-xs text-muted">
                    <Link href={`/boards/${board.id}`} className="hover:text-paper">
                        {board.name}
                    </Link>
                    <span aria-hidden="true"> / </span>
                    <span className="text-muted">Pengaturan</span>
                </p>
                <header className="mt-2">
                    <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-paper">
                        Pengaturan board
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        Atur nama board, anggota, dan label yang dipakai di kartu.
                    </p>
                </header>

                <div className="mt-8 space-y-5">
                    <section className="rounded-panel border border-hairline p-5">
                        <div className="flex items-center gap-2">
                            <Settings size={15} aria-hidden="true" className="text-muted" />
                            <h2 className="text-[15px] font-semibold text-paper">Nama board</h2>
                        </div>
                        <p className="mt-1 text-[13px] text-muted">Nama ini tampil di top bar dan sidebar.</p>
                        <form onSubmit={renameBoard} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Field label="Nama board" htmlFor={boardNameId} error={renameForm.errors.name} className="flex-1">
                                <Input
                                    id={boardNameId}
                                    value={renameForm.data.name}
                                    invalid={Boolean(renameForm.errors.name)}
                                    onChange={(event) => renameForm.setData('name', event.target.value)}
                                    disabled={!isOwner}
                                />
                            </Field>
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={!isOwner || renameForm.processing || renameForm.data.name.trim() === board.name}
                            >
                                {renameForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </form>
                        {!isOwner ? (
                            <p className="mt-2 text-[11px] text-muted">
                                Hanya Pemilik Workspace yang bisa mengganti nama board.
                            </p>
                        ) : null}
                    </section>

                    <section className="rounded-panel border border-hairline p-5">
                        <div className="flex items-center gap-2">
                            <Users size={15} aria-hidden="true" className="text-muted" />
                            <h2 className="text-[15px] font-semibold text-paper">Anggota board</h2>
                        </div>
                        <p className="mt-1 text-[13px] text-muted">
                            Assignee kartu dan live presence hanya dari anggota board.
                        </p>
                        <ul className="mt-4 divide-y divide-hairline rounded-[8px] border border-hairline">
                            {members.map((member) => (
                                <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
                                    <Avatar name={member.name} avatarUrl={member.avatarUrl} size="md" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-medium text-paper">{member.name}</p>
                                        <p className="truncate text-[11px] text-muted">{member.email}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-muted">
                                        {workspace.owner_id === Number(member.id) ? 'Pemilik workspace' : 'Anggota'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {isOwner ? (
                            <form onSubmit={addMember} noValidate className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <Field
                                    label="Tambah anggota lewat email"
                                    htmlFor={memberId}
                                    error={memberForm.errors.email}
                                    hint="Email akun KurFlow"
                                    className="flex-1"
                                >
                                    <Input
                                        id={memberId}
                                        type="email"
                                        value={memberForm.data.email}
                                        placeholder="nama@perusahaan.id"
                                        invalid={Boolean(memberForm.errors.email)}
                                        onChange={(event) => memberForm.setData('email', event.target.value)}
                                    />
                                </Field>
                                <Button type="submit" variant="secondary" disabled={memberForm.processing}>
                                    <UserRound size={14} aria-hidden="true" />
                                    {memberForm.processing ? 'Menambah...' : 'Tambah Anggota'}
                                </Button>
                            </form>
                        ) : null}
                    </section>

                    <section className="rounded-panel border border-hairline p-5">
                        <div className="flex items-center gap-2">
                            <Tags size={15} aria-hidden="true" className="text-muted" />
                            <h2 className="text-[15px] font-semibold text-paper">Label</h2>
                        </div>
                        <p className="mt-1 text-[13px] text-muted">
                            Label dipasang ke kartu dan dipakai sebagai filter cepat.
                        </p>

                        {labels.length === 0 ? (
                            <div className="mt-4 rounded-[8px] border border-hairline">
                                <EmptyState
                                    icon={<Tags size={16} aria-hidden="true" />}
                                    title="Belum ada label"
                                    description="Buat label pertama untuk menandai bug, fitur, atau prioritas."
                                />
                            </div>
                        ) : (
                            <ul className="mt-4 divide-y divide-hairline rounded-[8px] border border-hairline">
                                {labels.map((label) => (
                                    <li key={label.id} className="flex items-center gap-2.5 px-3 py-2.5">
                                        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                                        <span className="text-[13px] text-paper">{label.name}</span>
                                        <span className="ml-auto text-[11px] text-muted">
                                            {LABEL_COLORS.find((color) => color.value === label.color)?.name}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={createLabel} noValidate className="mt-4 space-y-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <Field label="Nama label" htmlFor={labelId} error={labelForm.errors.name} hint="1 sampai 30 karakter" className="flex-1">
                                    <Input
                                        id={labelId}
                                        value={labelForm.data.name}
                                        invalid={Boolean(labelForm.errors.name)}
                                        onChange={(event) => labelForm.setData('name', event.target.value)}
                                    />
                                </Field>
                                <Button type="submit" variant="secondary" disabled={labelForm.processing}>
                                    <Tags size={14} aria-hidden="true" />
                                    {labelForm.processing ? 'Menyimpan...' : 'Buat Label'}
                                </Button>
                            </div>
                            <fieldset>
                                <legend className="text-xs font-medium text-muted">Warna label</legend>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {LABEL_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={labelForm.data.color === color.value}
                                            aria-label={color.name}
                                            title={color.name}
                                            onClick={() => labelForm.setData('color', color.value)}
                                            className={`h-8 w-8 rounded-full transition-shadow duration-150 max-sm:h-11 max-sm:w-11 ${
                                                labelForm.data.color === color.value
                                                    ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-panel'
                                                    : 'ring-1 ring-white/10 hover:ring-white/30'
                                            }`}
                                            style={{ backgroundColor: color.value }}
                                        />
                                    ))}
                                    <span className="text-[11px] text-muted">{selectedColorName}</span>
                                </div>
                            </fieldset>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}

export default Object.assign(BoardSettings, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
