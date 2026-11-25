import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
    title: string;
    heading: string;
    subtitle: string;
    children: ReactNode;
}

export function AuthLayout({ title, heading, subtitle, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
            <Head title={title}>
                <meta name="description" content="Papan kanban dan sprint tim dengan pembaruan real-time." />
            </Head>
            <div className="w-full max-w-[400px]">
                <div className="mb-6 flex justify-center">
                    <Logo size="lg" />
                </div>
                <div className="rounded-panel border border-hairline bg-panel p-6">
                    <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-paper">
                        {heading}
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>
                    <div className="mt-6">{children}</div>
                </div>
                <p className="mt-6 text-center text-xs leading-relaxed text-muted">
                    Papan kanban dan sprint tim dengan pembaruan real-time.
                </p>
            </div>
        </div>
    );
}
