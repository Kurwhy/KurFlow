<?php

use App\Models\Board;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('board.{boardId}', function (User $user, int $boardId) {
    $board = Board::find($boardId);

    if (! $board || ! $board->hasMember($user->id)) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar_url' => $user->avatar_url,
    ];
});
