<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;

class BoardPolicy
{
    public function view(User $user, Board $board): bool
    {
        return $board->hasMember($user->id);
    }

    public function update(User $user, Board $board): bool
    {
        return $board->isOwnedBy($user->id);
    }

    public function addMember(User $user, Board $board): bool
    {
        return $board->isOwnedBy($user->id);
    }

    public function createLabel(User $user, Board $board): bool
    {
        return $board->hasMember($user->id);
    }

    public function createColumn(User $user, Board $board): bool
    {
        return $board->hasMember($user->id);
    }

    public function createSprint(User $user, Board $board): bool
    {
        return $board->hasMember($user->id);
    }
}
