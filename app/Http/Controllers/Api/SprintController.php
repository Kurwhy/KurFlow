<?php

namespace App\Http\Controllers\Api;

use App\Events\SprintUpdated;
use App\Http\Controllers\Controller;
use App\Support\BroadcastNow;
use App\Http\Requests\Sprint\StoreSprintRequest;
use App\Http\Resources\SprintResource;
use App\Models\Board;
use App\Models\Sprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SprintController extends Controller
{
    public function store(StoreSprintRequest $request, Board $board): JsonResponse
    {
        $this->authorize('createSprint', $board);

        $sprint = Sprint::create([
            'board_id' => $board->id,
            'name' => trim($request->validated('name')),
            'start_date' => $request->validated('start_date'),
            'end_date' => $request->validated('end_date'),
            'status' => 'direncanakan',
        ]);

        $active = $board->activeSprint();
        BroadcastNow::send(new SprintUpdated(
            $board->id,
            (new SprintResource($sprint))->resolve(),
            $active ? (new SprintResource($active))->resolve() : null,
        ));

        return response()->json(['sprint' => (new SprintResource($sprint))->resolve()], 201);
    }

    public function start(Sprint $sprint): JsonResponse
    {
        $this->authorize('start', $sprint);

        $sprint = DB::transaction(function () use ($sprint) {
            Board::whereKey($sprint->board_id)->lockForUpdate()->firstOrFail();
            $locked = Sprint::whereKey($sprint->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'direncanakan') {
                throw ValidationException::withMessages([
                    'sprint' => 'Sprint ini sudah dijalankan.',
                ]);
            }

            $hasActive = Sprint::where('board_id', $locked->board_id)
                ->where('status', 'aktif')
                ->exists();

            if ($hasActive) {
                throw ValidationException::withMessages([
                    'sprint' => 'Selesaikan sprint aktif terlebih dahulu.',
                ]);
            }

            $locked->update([
                'status' => 'aktif',
                'started_at' => now(),
            ]);

            return $locked;
        });

        $sprint->refresh();
        BroadcastNow::send(new SprintUpdated(
            $sprint->board_id,
            (new SprintResource($sprint))->resolve(),
            (new SprintResource($sprint))->resolve(),
        ));

        return response()->json(['sprint' => (new SprintResource($sprint))->resolve()]);
    }

    public function complete(Sprint $sprint): JsonResponse
    {
        $this->authorize('complete', $sprint);

        $sprint = DB::transaction(function () use ($sprint) {
            Board::whereKey($sprint->board_id)->lockForUpdate()->firstOrFail();
            $locked = Sprint::whereKey($sprint->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== 'aktif') {
                throw ValidationException::withMessages([
                    'sprint' => 'Hanya sprint aktif yang bisa diselesaikan.',
                ]);
            }

            $locked->update([
                'status' => 'selesai',
                'completed_at' => now(),
            ]);

            return $locked;
        });

        $sprint->refresh();
        $active = Sprint::where('board_id', $sprint->board_id)->where('status', 'aktif')->first();

        BroadcastNow::send(new SprintUpdated(
            $sprint->board_id,
            (new SprintResource($sprint))->resolve(),
            $active ? (new SprintResource($active))->resolve() : null,
        ));

        return response()->json(['sprint' => (new SprintResource($sprint))->resolve()]);
    }
}
