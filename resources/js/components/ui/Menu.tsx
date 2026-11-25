import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export const Menu = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;

export function MenuContent({
    children,
    align = 'end',
    className,
}: {
    children: ReactNode;
    align?: 'start' | 'center' | 'end';
    className?: string;
}) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                align={align}
                sideOffset={6}
                className={cn(
                    'kurflow-popover z-50 min-w-[200px] rounded-[10px] border border-hairline bg-panel p-1 shadow-panel focus:outline-none',
                    className,
                )}
            >
                {children}
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
}

export function MenuItem({
    children,
    icon,
    onSelect,
    danger,
}: {
    children: ReactNode;
    icon?: ReactNode;
    onSelect?: (event: Event) => void;
    danger?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.Item
            onSelect={onSelect}
            className={cn(
                'flex select-none items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] outline-none data-[highlighted]:bg-white/[0.05]',
                danger ? 'text-danger data-[highlighted]:text-danger' : 'text-paper',
            )}
        >
            {icon ? <span className="text-muted">{icon}</span> : null}
            {children}
        </DropdownMenuPrimitive.Item>
    );
}

export function MenuSeparator() {
    return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-hairline" />;
}
