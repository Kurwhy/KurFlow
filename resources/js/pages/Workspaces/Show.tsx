import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronRight, LayoutGrid, Plus } from 'lucide-react';
import { FormEvent, ReactNode } from 'react';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AppLayout } from '@/layouts/AppLayout';
import type { User } from '@/types/kurflow';
import { useState } from 'react';

interface WorkspaceProps {
    id: number;
    name: string;
    owner_id: number;
    owner_name: string | null;
}

interface BoardRow {
    id: number;
    name: string;
    cards_count: number;
    active_sprint_name: string | null;
    members: { id: number; name: string; avatar_url: string | null }[];
}

interface Props {
    workspace: WorkspaceProps;
    boards: BoardRow[];
    isOwner: boolean;
}

function WorkspaceShow({ workspace, boards, isOwner }: Props) {
    const [open, setOpen] = useState(false);
    const [boardClientError, setBoardClientError] = useState<string | undefined>();
    const boardNameId = useFieldId('board-name');
    const renameId = useFieldId('workspace-rename');
    const boardForm = useForm({ name: '' });
    const renameForm = useForm({ name: workspace.name });

    function createBoard(event: FormEvent) {
        event.preventDefault();
        const trimmed = boardForm.data.name.trim();
        if (trimmed.length < 3 || trimmed.length > 60) {
            setBoardClientError('Nama board wajib diisi, 3 sampai 60 karakter.');
            return;
        }
        setBoardClientError(undefined);
        boardForm.post(`/workspaces/${workspace.id}/boards`, {
            onSuccess: () => {
                setOpen(false);
                boardForm.reset();
            },
        });
    }

    function renameWorkspace(event: FormEvent) {
        event.preventDefault();
        renameForm.patch(`/workspaces/${workspace.id}`, { preserveScroll: true });
    }

    function closeModal(next: boolean) {
        setOpen(next);
        if (!next) {
            boardForm.reset();
            boardForm.clearErrors();
            setBoardClientError(undefined);
        }
    }

    function mapMembers(members: BoardRow['members']): User[] {
        return members.map((member) => ({
            id: String(member.id),
            name: member.name,
            email: '',
            avatarUrl: member.avatar_url ?? undefined,
        }));
    }

    return (
        <>
            <Head title={workspace.name}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
                <header>
                    <p className="text-xs text-muted">
                        <Link href="/workspaces" className="hover:text-paper">
                            Workspace
                        </Link>
                        <span aria-hidden="true"> / </span>
                        <span className="text-muted">{workspace.name}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-paper">
                                {workspace.name}
                            </h1>
                            <p className="mt-1 text-sm text-muted tnum">
                                {boards.length} board
                                {workspace.owner_name ? ` · Pemilik: ${workspace.owner_name}` : ''}
                            </p>
                        </div>
                        {isOwner ? (
                            <Button variant="primary" onClick={() => setOpen(true)}>
                                <Plus size={15} aria-hidden="true" />
                                Buat Board
                            </Button>
                        ) : null}
                    </div>
                </header>

                <section aria-label="Daftar board" className="mt-8">
                    {boards.length === 0 ? (
                        <div className="rounded-panel border border-hairline">
                            <EmptyState
                                icon={<LayoutGrid size={18} aria-hidden="true" />}
                                title="Belum ada board di workspace ini"
                                description="Board berisi kolom status, kartu tugas, dan sprint untuk tim Anda."
                                action={
                                    isOwner ? (
                                        <Button variant="primary" onClick={() => setOpen(true)}>
                                            Buat Board
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    ) : (
                        <ul className="overflow-hidden rounded-panel border border-hairline">
                            {boards.map((board) => (
                                <li key={board.id} className="border-b border-hairline last:border-b-0">
                                    <Link
                                        href={`/boards/${board.id}`}
                                        className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-[120ms] hover:bg-white/[0.025]"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-paper">
                                                {board.name}
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted tnum">
                                                {board.cards_count} kartu
                                                <span aria-hidden="true" className="text-faint">
                                                    ·
                                                </span>
                                                {board.active_sprint_name ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald" />
                                                        {board.active_sprint_name} aktif
                                                    </span>
                                                ) : (
                                                    <span>Tanpa sprint aktif</span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="hidden sm:block">
                                            <AvatarStack users={mapMembers(board.members)} max={4} />
                                        </span>
                                        <ChevronRight
                                            size={16}
                                            aria-hidden="true"
                                            className="shrink-0 text-faint transition-colors duration-[120ms] group-hover:text-paper"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {isOwner ? (
                    <section className="mt-8 rounded-panel border border-hairline p-5">
                        <h2 className="text-[15px] font-semibold text-paper">Ganti nama workspace</h2>
                        <p className="mt-1 text-[13px] text-muted">
                            Nama ini tampil di sidebar untuk semua anggota board.
                        </p>
                        <form onSubmit={renameWorkspace} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Field label="Nama workspace" htmlFor={renameId} error={renameForm.errors.name} className="flex-1">
                                <Input
                                    id={renameId}
                                    value={renameForm.data.name}
                                    invalid={Boolean(renameForm.errors.name)}
                                    onChange={(event) => renameForm.setData('name', event.target.value)}
                                />
                            </Field>
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={renameForm.processing || renameForm.data.name.trim() === workspace.name}
                            >
                                {renameForm.processing ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </form>
                    </section>
                ) : null}
            </div>

            <Modal
                open={open}
                onOpenChange={closeModal}
                title="Buat board"
                description="Sistem akan membuat kolom Backlog, Dikerjakan, Review Kode, dan Selesai."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => closeModal(false)}>
                            Batal
                        </Button>
                        <Button variant="primary" type="submit" form="create-board-form" disabled={boardForm.processing}>
                            {boardForm.processing ? 'Menyimpan...' : 'Buat Board'}
                        </Button>
                    </>
                }
            >
                <form id="create-board-form" onSubmit={createBoard} noValidate>
                    <Field label="Nama board" htmlFor={boardNameId} error={boardClientError ?? boardForm.errors.name} hint="3 sampai 60 karakter">
                        <Input
                            id={boardNameId}
                            value={boardForm.data.name}
                            invalid={Boolean(boardClientError ?? boardForm.errors.name)}
                            onChange={(event) => {
                                boardForm.setData('name', event.target.value);
                                setBoardClientError(undefined);
                            }}
                            autoFocus
                        />
                    </Field>
                </form>
            </Modal>
        </>
    );
}

export default Object.assign(WorkspaceShow, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
