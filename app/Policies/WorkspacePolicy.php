<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;

class WorkspacePolicy
{
    public function view(User $user, Workspace $workspace): bool
    {
        if ((int) $workspace->owner_id === (int) $user->id) {
            return true;
        }

        return $workspace->boards()->whereHas('members', fn ($query) => $query->whereKey($user->id))->exists();
    }

    public function update(User $user, Workspace $workspace): bool
    {
        return (int) $workspace->owner_id === (int) $user->id;
    }

    public function createBoard(User $user, Workspace $workspace): bool
    {
        return (int) $workspace->owner_id === (int) $user->id;
    }
}
