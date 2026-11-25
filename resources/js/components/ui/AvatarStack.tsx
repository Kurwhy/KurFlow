import type { User } from '@/types/kurflow';
import { Avatar } from './Avatar';

interface AvatarStackProps {
    users: User[];
    max?: number;
    onlineUserIds?: string[];
}

export function AvatarStack({ users, max = 5, onlineUserIds = [] }: AvatarStackProps) {
    if (users.length === 0) return null;

    const shown = users.slice(0, max);
    const overflow = users.length - shown.length;

    return (
        <div className="flex items-center" aria-label={`${users.length} anggota membuka board`}>
            <div className="flex -space-x-2">
                {shown.map((user) => (
                    <Avatar
                        key={user.id}
                        name={user.name}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                        bordered
                        online={onlineUserIds.includes(user.id)}
                    />
                ))}
            </div>
            {overflow > 0 ? (
                <span
                    className="ml-1.5 flex h-7 min-w-7 items-center justify-center rounded-full border border-hairline bg-surface px-1.5 text-[11px] text-muted tnum"
                    title={`${overflow} anggota lain`}
                >
                    +{overflow}
                </span>
            ) : null}
        </div>
    );
}
