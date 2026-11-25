<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $boardId,
        public int $cardId,
        public array $comment,
        public int $commentCount,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'CommentCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'card_id' => $this->cardId,
            'comment' => $this->comment,
            'comment_count' => $this->commentCount,
        ];
    }
}
