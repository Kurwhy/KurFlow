import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

interface SlideOverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
}

export function SlideOver({ open, onOpenChange, title, children }: SlideOverProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="kurflow-overlay fixed inset-0 z-40 bg-black/60" />
                <DialogPrimitive.Content className="kurflow-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col rounded-l-panel border-l border-hairline bg-panel shadow-drawer focus:outline-none">
                    <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Detail kartu, komentar, dan riwayat perpindahan kolom.
                    </DialogPrimitive.Description>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
