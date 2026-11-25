<?php

namespace Tests\Concerns;

use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Card;
use App\Models\User;
use App\Models\Workspace;

trait CreatesKurflowBoard
{
    protected function makeScenario(): array
    {
        $owner = User::create([
            'name' => 'Rizky Pratama',
            'email' => 'rizky@example.test',
            'password' => 'password',
        ]);
        $member = User::create([
            'name' => 'Dewi Lestari',
            'email' => 'dewi@example.test',
            'password' => 'password',
        ]);
        $outsider = User::create([
            'name' => 'Orang Luar',
            'email' => 'luar@example.test',
            'password' => 'password',
        ]);

        $workspace = Workspace::create(['owner_id' => $owner->id, 'name' => 'Tim Produk']);
        $board = Board::create(['workspace_id' => $workspace->id, 'name' => 'Aplikasi Kasir']);
        $board->members()->attach([$owner->id, $member->id]);

        $backlog = BoardColumn::create(['board_id' => $board->id, 'name' => 'Backlog', 'rank' => 'a0']);
        $done = BoardColumn::create(['board_id' => $board->id, 'name' => 'Selesai', 'rank' => 'a1']);

        $card = Card::create([
            'board_id' => $board->id,
            'column_id' => $backlog->id,
            'created_by' => $owner->id,
            'title' => 'Kartu utama',
            'rank' => 'a0',
        ]);
        $otherCard = Card::create([
            'board_id' => $board->id,
            'column_id' => $backlog->id,
            'created_by' => $owner->id,
            'title' => 'Kartu lain',
            'rank' => 'a1',
        ]);
        $otherCard->forceFill(['updated_at' => '2020-01-01 00:00:00'])->saveQuietly();

        return compact('owner', 'member', 'outsider', 'workspace', 'board', 'backlog', 'done', 'card', 'otherCard');
    }
}
