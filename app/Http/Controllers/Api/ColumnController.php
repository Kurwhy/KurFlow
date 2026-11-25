<?php

namespace App\Http\Controllers\Api;

use App\Events\ColumnCreated;
use App\Events\ColumnMoved;
use App\Events\ColumnUpdated;
use App\Http\Controllers\Controller;
use App\Support\BroadcastNow;
use App\Http\Requests\Column\MoveColumnRequest;
use App\Http\Requests\Column\StoreColumnRequest;
use App\Http\Requests\Column\UpdateColumnRequest;
use App\Http\Resources\ColumnResource;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Support\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ColumnController extends Controller
{
    public function store(StoreColumnRequest $request, Board $board): JsonResponse
    {
        $this->authorize('createColumn', $board);

        $column = DB::transaction(function () use ($request, $board) {
            Board::whereKey($board->id)->lockForUpdate()->firstOrFail();

            $lastRank = BoardColumn::where('board_id', $board->id)->orderByDesc('rank')->value('rank');

            return BoardColumn::create([
                'board_id' => $board->id,
                'name' => trim($request->validated('name')),
                'rank' => RankService::after($lastRank),
            ]);
        });

        BroadcastNow::send(new ColumnCreated($board->id, (new ColumnResource($column))->resolve()));

        return response()->json(['column' => (new ColumnResource($column))->resolve()], 201);
    }

    public function update(UpdateColumnRequest $request, BoardColumn $column): JsonResponse
    {
        $this->authorize('update', $column);

        $column->update(['name' => trim($request->validated('name'))]);

        BroadcastNow::send(new ColumnUpdated($column->board_id, (new ColumnResource($column))->resolve()));

        return response()->json(['column' => (new ColumnResource($column))->resolve()]);
    }

    public function move(MoveColumnRequest $request, BoardColumn $column): JsonResponse
    {
        $this->authorize('move', $column);

        $board = $column->board;
        $data = $request->validated();

        $before = null;
        $after = null;

        if (! empty($data['before_column_id'])) {
            if ((int) $data['before_column_id'] === (int) $column->id) {
                throw ValidationException::withMessages(['rank' => 'Kolom pembanding tidak valid.']);
            }
            $before = BoardColumn::where('board_id', $board->id)->find($data['before_column_id']);
            if (! $before) {
                throw ValidationException::withMessages(['rank' => 'Kolom pembanding tidak ditemukan.']);
            }
        }
        if (! empty($data['after_column_id'])) {
            if ((int) $data['after_column_id'] === (int) $column->id) {
                throw ValidationException::withMessages(['rank' => 'Kolom pembanding tidak valid.']);
            }
            $after = BoardColumn::where('board_id', $board->id)->find($data['after_column_id']);
            if (! $after) {
                throw ValidationException::withMessages(['rank' => 'Kolom pembanding tidak ditemukan.']);
            }
        }
        if ($before && $after && strcmp($before->rank, $after->rank) >= 0) {
            throw ValidationException::withMessages(['rank' => 'Posisi kolom pembanding tidak berurutan.']);
        }

        $finalRank = DB::transaction(function () use ($column, $board, $data, $before, $after) {
            Board::whereKey($board->id)->lockForUpdate()->firstOrFail();
            $column->refresh();
            $beforeRank = $before ? BoardColumn::whereKey($before->id)->value('rank') : null;
            $afterRank = $after ? BoardColumn::whereKey($after->id)->value('rank') : null;

            $rank = $data['rank'];
            if (! RankService::isValidOrderKey($rank) || ! RankService::isBetween($rank, $beforeRank, $afterRank)) {
                $rank = RankService::between($beforeRank, $afterRank);
            }

            for ($attempt = 0; $attempt < 5; $attempt++) {
                $conflict = BoardColumn::where('board_id', $board->id)
                    ->where('rank', $rank)
                    ->whereKeyNot($column->id)
                    ->first();

                if (! $conflict) {
                    break;
                }

                $nextRank = BoardColumn::where('board_id', $board->id)
                    ->where('rank', '>', $conflict->rank)
                    ->orderBy('rank')
                    ->value('rank');

                $rank = RankService::between($conflict->rank, $nextRank);
            }

            if (strlen($rank) > 64) {
                throw ValidationException::withMessages(['rank' => 'Rank maksimal 64 karakter.']);
            }

            $column->forceFill(['rank' => $rank])->save();

            return $rank;
        });

        $column->refresh();

        BroadcastNow::send(new ColumnMoved($board->id, (new ColumnResource($column))->resolve()));

        return response()->json(['column' => (new ColumnResource($column))->resolve(), 'rank' => $finalRank]);
    }
}
