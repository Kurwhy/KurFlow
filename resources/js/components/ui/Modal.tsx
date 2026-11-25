import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="kurflow-overlay fixed inset-0 z-40 bg-black/60" />
                <DialogPrimitive.Content className="kurflow-panel fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-hairline bg-panel p-5 shadow-panel focus:outline-none">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-paper">
                                {title}
                            </DialogPrimitive.Title>
                            {description ? (
                                <DialogPrimitive.Description className="mt-1 text-[13px] leading-relaxed text-muted">
                                    {description}
                                </DialogPrimitive.Description>
                            ) : null}
                        </div>
                        <DialogPrimitive.Close asChild>
                            <Button variant="ghost" size="icon" aria-label="Tutup dialog">
                                <X size={16} aria-hidden="true" />
                            </Button>
                        </DialogPrimitive.Close>
                    </div>
                    <div className="mt-4">{children}</div>
                    {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
