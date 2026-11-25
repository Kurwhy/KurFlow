import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import type { NavigationWorkspace, SharedProps, User } from '@/types/kurflow';

interface SidebarData {
    user: User | null;
    workspaces: NavigationWorkspace[];
}

function normalizeNavigation(navigation: SharedProps['navigation'] | undefined): NavigationWorkspace[] {
    const workspaces = navigation?.workspaces ?? [];

    return workspaces.map((workspace) => ({
        id: String(workspace.id),
        name: workspace.name,
        boards: (workspace.boards ?? []).map((board) => ({
            id: String(board.id),
            name: board.name,
            hasActiveSprint: Boolean(board.hasActiveSprint ?? (board as unknown as { has_active_sprint?: boolean }).has_active_sprint),
        })),
    }));
}

function SidebarNav({ data, onNavigate }: { data: SidebarData; onNavigate?: () => void }) {
    const { url } = usePage();

    return (
        <nav aria-label="Navigasi workspace" className="flex-1 overflow-y-auto px-2 py-3">
            <p className="px-2 pb-1.5 text-[11px] font-medium text-muted">Workspace</p>
            {data.workspaces.map((workspace) => {
                const workspaceActive = url.startsWith(`/workspaces/${workspace.id}`);

                return (
                    <div key={workspace.id} className="mb-2">
                        <Link
                            href={`/workspaces/${workspace.id}`}
                            onClick={onNavigate}
                            className={`flex h-8 items-center gap-2 rounded-btn px-2 text-[13px] transition-colors duration-150 hover:bg-white/[0.03] max-sm:h-11 ${
                                workspaceActive
                                    ? 'bg-white/[0.04] font-medium text-paper'
                                    : 'text-muted hover:text-paper'
                            }`}
                        >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-hairline text-[10px] text-muted">
                                {workspace.name.slice(0, 1)}
                            </span>
                            <span className="truncate">{workspace.name}</span>
                        </Link>
                        {workspace.boards.length > 0 ? (
                            <ul className="mt-0.5 space-y-0.5 pl-4">
                                {workspace.boards.map((board) => {
                                    const boardActive = url.startsWith(`/boards/${board.id}`);
                                    return (
                                        <li key={board.id}>
                                            <Link
                                                href={`/boards/${board.id}`}
                                                onClick={onNavigate}
                                                className={`flex h-8 items-center gap-2 rounded-btn px-2 text-[13px] transition-colors duration-150 hover:bg-white/[0.03] max-sm:h-11 ${
                                                    boardActive
                                                        ? 'bg-white/[0.04] font-medium text-paper'
                                                        : 'text-muted hover:text-paper'
                                                }`}
                                            >
                                                <span className="truncate">{board.name}</span>
                                                {board.hasActiveSprint ? (
                                                    <span
                                                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald"
                                                        title="Sprint aktif"
                                                    />
                                                ) : null}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                );
            })}
        </nav>
    );
}

function AccountRow({ user }: { user: User | null }) {
    if (!user) return null;

    return (
        <div className="border-t border-hairline p-3">
            <div className="flex items-center gap-2.5">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-paper">{user.name}</p>
                    <p className="truncate text-[11px] text-muted">{user.email}</p>
                </div>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    aria-label="Keluar"
                    title="Keluar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-btn text-faint transition-colors duration-150 hover:bg-white/[0.04] hover:text-paper max-sm:h-11 max-sm:w-11"
                >
                    <LogOut size={15} aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { url } = usePage();
    const { auth, navigation, flash } = usePage<SharedProps>().props;
    const toast = useToast();

    const authUser = auth?.user
        ? {
              id: String(auth.user.id),
              name: auth.user.name,
              email: auth.user.email,
              avatarUrl: (auth.user as unknown as { avatar_url?: string }).avatar_url ?? auth.user.avatarUrl,
          }
        : null;

    const data: SidebarData = {
        user: authUser,
        workspaces: normalizeNavigation(navigation),
    };

    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    useEffect(() => {
        if (flash?.success) toast.push(flash.success, 'success');
        if (flash?.error) toast.push(flash.error, 'error');
    }, [flash?.success, flash?.error, toast]);

    return (
        <div className="min-h-dvh bg-ink">
            <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-hairline lg:bg-ink">
                <div className="flex h-14 shrink-0 items-center border-b border-hairline px-4">
                    <Link href="/workspaces" aria-label="KurFlow, ke daftar workspace">
                        <Logo />
                    </Link>
                </div>
                <SidebarNav data={data} />
                <AccountRow user={data.user} />
            </aside>

            <header className="flex h-14 items-center justify-between border-b border-hairline px-3 lg:hidden">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileOpen(true)}
                    aria-haspopup="dialog"
                >
                    <Menu size={16} aria-hidden="true" />
                    Menu
                </Button>
                <Link href="/workspaces" aria-label="KurFlow, ke daftar workspace">
                    <Logo />
                </Link>
                {authUser ? (
                    <Avatar name={authUser.name} avatarUrl={authUser.avatarUrl} size="sm" />
                ) : (
                    <span className="h-7 w-7" />
                )}
            </header>

            <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="kurflow-overlay fixed inset-0 z-40 bg-black/60" />
                    <DialogPrimitive.Content className="kurflow-drawer-left fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-hairline bg-ink focus:outline-none">
                        <DialogPrimitive.Title className="sr-only">Menu navigasi</DialogPrimitive.Title>
                        <DialogPrimitive.Description className="sr-only">
                            Daftar workspace dan board yang bisa Anda buka.
                        </DialogPrimitive.Description>
                        <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
                            <Logo />
                            <DialogPrimitive.Close asChild>
                                <Button variant="ghost" size="icon" aria-label="Tutup menu">
                                    <X size={16} aria-hidden="true" />
                                </Button>
                            </DialogPrimitive.Close>
                        </div>
                        <SidebarNav data={data} onNavigate={() => setMobileOpen(false)} />
                        <AccountRow user={data.user} />
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            <div className="lg:pl-60">
                <main className="min-h-dvh">{children}</main>
            </div>
        </div>
    );
}
