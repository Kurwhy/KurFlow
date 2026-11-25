import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ChevronRight, FolderKanban, Plus } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, useFieldId } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AppLayout } from '@/layouts/AppLayout';
import type { SharedProps } from '@/types/kurflow';

interface WorkspaceRow {
    id: number;
    name: string;
    owner_name: string | null;
    boards_count: number;
}

interface Props {
    workspaces: WorkspaceRow[];
}

function WorkspacesIndex({ workspaces }: Props) {
    const [open, setOpen] = useState(false);
    const nameId = useFieldId('workspace-name');
    const { auth } = usePage<SharedProps>().props;
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ name: '' });
    const [clientError, setClientError] = useState<string | undefined>();

    function submit(event: FormEvent) {
        event.preventDefault();
        const trimmed = data.name.trim();
        if (trimmed.length < 3 || trimmed.length > 60) {
            setClientError('Nama workspace wajib diisi, 3 sampai 60 karakter.');
            return;
        }
        setClientError(undefined);
        post('/workspaces', {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    function closeModal(next: boolean) {
        setOpen(next);
        if (!next) {
            reset();
            clearErrors();
            setClientError(undefined);
        }
    }

    return (
        <>
            <Head title="Workspace">
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-paper">
                            Workspace
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                            {auth?.user ? `Masuk sebagai ${auth.user.name}. ` : ''}
                            Pilih workspace untuk membuka board tim Anda.
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => setOpen(true)}>
                        <Plus size={15} aria-hidden="true" />
                        Buat Workspace
                    </Button>
                </header>

                <section aria-label="Daftar workspace" className="mt-8">
                    {workspaces.length === 0 ? (
                        <div className="rounded-panel border border-hairline">
                            <EmptyState
                                icon={<FolderKanban size={18} aria-hidden="true" />}
                                title="Belum ada workspace"
                                description="Buat workspace pertama Anda untuk mulai mengelola board tim."
                                action={
                                    <Button variant="primary" onClick={() => setOpen(true)}>
                                        Buat Workspace
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <ul className="overflow-hidden rounded-panel border border-hairline">
                            {workspaces.map((workspace) => (
                                <li key={workspace.id} className="border-b border-hairline last:border-b-0">
                                    <Link
                                        href={`/workspaces/${workspace.id}`}
                                        className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-[120ms] hover:bg-white/[0.025]"
                                    >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-hairline text-[12px] font-medium text-muted">
                                            {workspace.name.slice(0, 1)}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-paper">
                                                {workspace.name}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-muted tnum">
                                                {workspace.boards_count} board
                                                {workspace.owner_name ? ` · Pemilik: ${workspace.owner_name}` : ''}
                                            </span>
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
            </div>

            <Modal
                open={open}
                onOpenChange={closeModal}
                title="Buat workspace"
                description="Workspace berisi board dan anggota tim Anda."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => closeModal(false)}>
                            Batal
                        </Button>
                        <Button variant="primary" type="submit" form="create-workspace-form" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Buat Workspace'}
                        </Button>
                    </>
                }
            >
                <form id="create-workspace-form" onSubmit={submit} noValidate>
                    <Field label="Nama workspace" htmlFor={nameId} error={clientError ?? errors.name} hint="3 sampai 60 karakter">
                        <Input
                            id={nameId}
                            value={data.name}
                            invalid={Boolean(clientError ?? errors.name)}
                            onChange={(event) => {
                                setData('name', event.target.value);
                                setClientError(undefined);
                            }}
                            autoFocus
                        />
                    </Field>
                </form>
            </Modal>
        </>
    );
}

export default Object.assign(WorkspacesIndex, {
    layout: (page: ReactNode) => <AppLayout>{page}</AppLayout>,
});
