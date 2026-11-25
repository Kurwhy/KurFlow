<?php

namespace App\Services;

use App\Http\Resources\CardResource;
use App\Http\Resources\ColumnResource;
use App\Http\Resources\LabelResource;
use App\Http\Resources\MemberResource;
use App\Http\Resources\SprintResource;
use App\Models\Board;
use App\Models\Card;

class BoardStateService
{
    public static function payload(Board $board): array
    {
        $board->load([
            'workspace:id,name,owner_id',
            'members:id,name,email,avatar_url',
            'labels',
            'columns',
        ]);

        $cards = Card::query()
            ->where('board_id', $board->id)
            ->with('labels')
            ->withCount('comments')
            ->get();

        $activeSprint = $board->activeSprint();

        return [
            'board' => [
                'id' => $board->id,
                'name' => $board->name,
                'workspace_id' => $board->workspace_id,
            ],
            'workspace' => [
                'id' => $board->workspace->id,
                'name' => $board->workspace->name,
                'owner_id' => $board->workspace->owner_id,
            ],
            'columns' => ColumnResource::collection($board->columns)->resolve(),
            'cards' => CardResource::collection($cards)->resolve(),
            'labels' => LabelResource::collection($board->labels)->resolve(),
            'members' => MemberResource::collection($board->members)->resolve(),
            'activeSprint' => $activeSprint ? (new SprintResource($activeSprint))->resolve() : null,
        ];
    }
}
