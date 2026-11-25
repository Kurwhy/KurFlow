<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class CardActivityCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $boardId,
        public int $cardId,
        public array $activity,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'CardActivityCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'card_id' => $this->cardId,
            'activity' => $this->activity,
        ];
    }
}
