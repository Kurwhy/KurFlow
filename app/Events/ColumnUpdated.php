<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class ColumnUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public int $boardId,
        public array $column,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'ColumnUpdated';
    }

    public function broadcastWith(): array
    {
        return ['column' => $this->column];
    }
}
