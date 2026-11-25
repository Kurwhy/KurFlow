<?php

namespace App\Policies;

use App\Models\Card;
use App\Models\User;

class CardPolicy
{
    public function view(User $user, Card $card): bool
    {
        return $card->board->hasMember($user->id);
    }

    public function update(User $user, Card $card): bool
    {
        return $card->board->hasMember($user->id);
    }

    public function move(User $user, Card $card): bool
    {
        return $card->board->hasMember($user->id);
    }

    public function comment(User $user, Card $card): bool
    {
        return $card->board->hasMember($user->id);
    }
}
