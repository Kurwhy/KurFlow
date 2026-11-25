<?php

namespace App\Policies;

use App\Models\BoardColumn;
use App\Models\User;

class BoardColumnPolicy
{
    public function update(User $user, BoardColumn $column): bool
    {
        return $column->board->hasMember($user->id);
    }

    public function move(User $user, BoardColumn $column): bool
    {
        return $column->board->hasMember($user->id);
    }
}
