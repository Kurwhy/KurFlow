<?php

namespace App\Http\Controllers\Api;

use App\Events\CardActivityCreated;
use App\Events\CardCreated;
use App\Events\CardMoved;
use App\Events\CardUpdated;
use App\Events\CommentCreated;
use App\Http\Controllers\Controller;
use App\Support\BroadcastNow;
use App\Http\Requests\Card\MoveCardRequest;
use App\Http\Requests\Card\StoreCardRequest;
use App\Http\Requests\Card\StoreCommentRequest;
use App\Http\Requests\Card\UpdateCardRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\CardResource;
use App\Http\Resources\CommentResource;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Card;
use App\Support\RankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CardController extends Controller
{
    public function store(StoreCardRequest $request, Board $board): JsonResponse
    {
        $this->authorize('view', $board);

        $column = BoardColumn::where('board_id', $board->id)->findOrFail($request->integer('column_id'));

        $card = DB::transaction(function () use ($request, $board, $column) {
            Board::whereKey($board->id)->lockForUpdate()->firstOrFail();

            $lastRank = Card::where('column_id', $column->id)->orderByDesc('rank')->value('rank');

            return Card::create([
                'board_id' => $board->id,
                'column_id' => $column->id,
                'created_by' => $request->user()->id,
                'title' => trim($request->validated('title')),
                'rank' => RankService::after($lastRank),
            ]);
        });

        $card->load(['labels', 'creator', 'assignee'])->loadCount('comments');

        BroadcastNow::send(new CardCreated($board->id, (new CardResource($card))->resolve()));

        return response()->json(['card' => (new CardResource($card))->resolve()], 201);
    }

    public function show(Card $card): JsonResponse
    {
        $this->authorize('view', $card);

        $card->load([
            'labels',
            'comments.user',
            'activities.user',
            'creator',
            'assignee',
        ]);

        return response()->json([
            'card' => (new CardResource($card))->resolve(),
            'comments' => CommentResource::collection($card->comments)->resolve(),
            'activities' => ActivityResource::collection($card->activities)->resolve(),
        ]);
    }

    public function update(UpdateCardRequest $request, Card $card): JsonResponse
    {
        $this->authorize('update', $card);

        $data = $request->validated();

        if (array_key_exists('title', $data)) {
            $data['title'] = trim($data['title']);
            if ($data['title'] === '') {
                throw ValidationException::withMessages([
                    'title' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
                ]);
            }
        }

        $labelIds = $data['label_ids'] ?? null;
        unset($data['label_ids']);

        DB::transaction(function () use ($card, $data, $labelIds) {
            $card->fill($data);
            $card->save();

            if ($labelIds !== null) {
                $card->labels()->sync($labelIds);
            }
        });

        $card->refresh()->load(['labels', 'creator', 'assignee'])->loadCount('comments');

        BroadcastNow::send(new CardUpdated($card->board_id, (new CardResource($card))->resolve()));

        return response()->json(['card' => (new CardResource($card))->resolve()]);
    }

    public function move(MoveCardRequest $request, Card $card): JsonResponse
    {
        $this->authorize('move', $card);

        $board = $card->board;
        $data = $request->validated();
        $column = BoardColumn::where('board_id', $board->id)->findOrFail($data['column_id']);

        $before = null;
        $after = null;

        if (! empty($data['before_card_id'])) {
            if ((int) $data['before_card_id'] === (int) $card->id) {
                throw ValidationException::withMessages(['rank' => 'Kartu pembanding tidak valid.']);
            }
            $before = Card::where('board_id', $board->id)->where('column_id', $column->id)->find($data['before_card_id']);
            if (! $before) {
                throw ValidationException::withMessages(['rank' => 'Kartu pembanding tidak ditemukan di kolom tujuan.']);
            }
        }

        if (! empty($data['after_card_id'])) {
            if ((int) $data['after_card_id'] === (int) $card->id) {
                throw ValidationException::withMessages(['rank' => 'Kartu pembanding tidak valid.']);
            }
            $after = Card::where('board_id', $board->id)->where('column_id', $column->id)->find($data['after_card_id']);
            if (! $after) {
                throw ValidationException::withMessages(['rank' => 'Kartu pembanding tidak ditemukan di kolom tujuan.']);
            }
        }

        if ($before && $after && strcmp($before->rank, $after->rank) >= 0) {
            throw ValidationException::withMessages(['rank' => 'Posisi kartu pembanding tidak berurutan.']);
        }

        $fromColumnId = $card->column_id;
        $fromColumnName = $card->column->name;
        $toColumnName = $column->name;

        [$activity, $finalRank] = DB::transaction(function () use ($card, $board, $column, $data, $before, $after, $fromColumnId, $fromColumnName, $toColumnName) {
            Board::whereKey($board->id)->lockForUpdate()->firstOrFail();
            $card->refresh();

            $beforeRank = $before ? Card::whereKey($before->id)->value('rank') : null;
            $afterRank = $after ? Card::whereKey($after->id)->value('rank') : null;

            if ($beforeRank !== null && $afterRank !== null && strcmp($beforeRank, $afterRank) >= 0) {
                throw ValidationException::withMessages(['rank' => 'Posisi kartu berubah. Coba pindahkan lagi.']);
            }

            $rank = $data['rank'];
            if (! RankService::isValidOrderKey($rank) || ! RankService::isBetween($rank, $beforeRank, $afterRank)) {
                $rank = RankService::between($beforeRank, $afterRank);
            }

            for ($attempt = 0; $attempt < 5; $attempt++) {
                $conflict = Card::where('column_id', $column->id)
                    ->where('rank', $rank)
                    ->whereKeyNot($card->id)
                    ->first();

                if (! $conflict) {
                    break;
                }

                $nextRank = Card::where('column_id', $column->id)
                    ->where('rank', '>', $conflict->rank)
                    ->orderBy('rank')
                    ->value('rank');

                $rank = RankService::between($conflict->rank, $nextRank);
            }

            if (strlen($rank) > 64) {
                throw ValidationException::withMessages(['rank' => 'Rank maksimal 64 karakter.']);
            }

            $card->forceFill([
                'column_id' => $column->id,
                'rank' => $rank,
            ])->save();

            $activity = null;
            if ((int) $fromColumnId !== (int) $column->id) {
                $activity = $card->activities()->create([
                    'user_id' => request()->user()->id,
                    'from_column_id' => $fromColumnId,
                    'to_column_id' => $column->id,
                    'from_column_name' => $fromColumnName,
                    'to_column_name' => $toColumnName,
                    'created_at' => now(),
                ]);
            }

            return [$activity, $rank];
        });

        $card->refresh()->load(['labels', 'creator', 'assignee'])->loadCount('comments');

        BroadcastNow::send(new CardMoved($board->id, (new CardResource($card))->resolve()));

        $activityPayload = null;
        if ($activity) {
            $activity->load('user');
            $activityPayload = (new ActivityResource($activity))->resolve();
            BroadcastNow::send(new CardActivityCreated($board->id, $card->id, $activityPayload));
        }

        return response()->json([
            'card' => (new CardResource($card))->resolve(),
            'activity' => $activityPayload,
            'rank' => $finalRank,
        ]);
    }

    public function comment(StoreCommentRequest $request, Card $card): JsonResponse
    {
        $this->authorize('comment', $card);

        $body = trim($request->validated('body'));
        if ($body === '') {
            throw ValidationException::withMessages([
                'body' => 'Komentar wajib diisi.',
            ]);
        }

        $comment = $card->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $body,
        ]);
        $comment->load('user');

        $count = $card->comments()->count();

        BroadcastNow::send(new CommentCreated(
            $card->board_id,
            $card->id,
            (new CommentResource($comment))->resolve(),
            $count,
        ));

        return response()->json([
            'comment' => (new CommentResource($comment))->resolve(),
            'comment_count' => $count,
        ], 201);
    }
}
