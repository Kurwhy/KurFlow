<?php

namespace App\Policies;

use App\Models\Sprint;
use App\Models\User;

class SprintPolicy
{
    public function view(User $user, Sprint $sprint): bool
    {
        return $sprint->board->hasMember($user->id);
    }

    public function start(User $user, Sprint $sprint): bool
    {
        return $sprint->board->hasMember($user->id);
    }

    public function complete(User $user, Sprint $sprint): bool
    {
        return $sprint->board->hasMember($user->id);
    }
}
