<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CardMoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $boardId,
        public array $card,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'CardMoved';
    }

    public function broadcastWith(): array
    {
        return ['card' => $this->card];
    }
}
