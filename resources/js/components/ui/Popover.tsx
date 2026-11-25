import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverPanelProps {
    children: ReactNode;
    align?: 'start' | 'center' | 'end';
    className?: string;
}

export function PopoverPanel({ children, align = 'start', className }: PopoverPanelProps) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                align={align}
                sideOffset={6}
                className={cn(
                    'kurflow-popover z-50 w-64 rounded-[10px] border border-hairline bg-panel p-2 shadow-panel focus:outline-none',
                    className,
                )}
            >
                {children}
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
    );
}
