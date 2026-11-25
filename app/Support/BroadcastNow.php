<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

final class BroadcastNow
{
    public static function send(object $event): void
    {
        if (method_exists($event, 'dontBroadcastToCurrentUser')) {
            $event->dontBroadcastToCurrentUser();
        }

        try {
            event($event);
        } catch (\Throwable $exception) {
            Log::warning('Broadcast gagal dikirim.', [
                'event' => get_class($event),
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
