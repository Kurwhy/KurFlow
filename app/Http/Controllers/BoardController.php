<?php

namespace App\Http\Controllers;

use App\Http\Requests\Board\AddBoardMemberRequest;
use App\Http\Requests\Board\StoreBoardRequest;
use App\Http\Requests\Board\StoreLabelRequest;
use App\Http\Requests\Board\UpdateBoardRequest;
use App\Http\Resources\LabelResource;
use App\Http\Resources\MemberResource;
use App\Http\Resources\SprintResource;
use App\Models\Board;
use App\Models\BoardColumn;
use App\Models\Label;
use App\Models\User;
use App\Models\Workspace;
use App\Services\BoardStateService;
use App\Support\RankService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BoardController extends Controller
{
    public function store(StoreBoardRequest $request, Workspace $workspace): RedirectResponse
    {
        $this->authorize('createBoard', $workspace);

        $board = DB::transaction(function () use ($request, $workspace) {
            $board = Board::create([
                'workspace_id' => $workspace->id,
                'name' => $request->validated('name'),
            ]);

            $board->members()->attach($request->user()->id);

            $rank = null;
            foreach (['Backlog', 'Dikerjakan', 'Review Kode', 'Selesai'] as $name) {
                $rank = RankService::after($rank);
                BoardColumn::create([
                    'board_id' => $board->id,
                    'name' => $name,
                    'rank' => $rank,
                ]);
            }

            return $board;
        });

        return redirect()->route('boards.show', $board)->with('success', 'Board dibuat dengan 4 kolom awal.');
    }

    public function update(UpdateBoardRequest $request, Board $board): RedirectResponse
    {
        $this->authorize('update', $board);

        $board->update(['name' => $request->validated('name')]);

        return back()->with('success', 'Nama board diperbarui.');
    }

    public function show(Board $board): Response
    {
        $this->authorize('view', $board);

        return Inertia::render('Boards/Show', BoardStateService::payload($board));
    }

    public function sprints(Request $request, Board $board): Response
    {
        $this->authorize('view', $board);

        $sprints = $board->sprints()
            ->withCount('cards')
            ->orderByDesc('start_date')
            ->get();

        return Inertia::render('Boards/Sprints', [
            'board' => ['id' => $board->id, 'name' => $board->name],
            'workspace' => ['id' => $board->workspace->id, 'name' => $board->workspace->name],
            'sprints' => $sprints->map(fn ($sprint) => [
                ...(new SprintResource($sprint))->resolve(),
                'cards_count' => $sprint->cards_count,
            ])->values(),
            'activeSprintId' => $board->activeSprint()?->id,
        ]);
    }

    public function settings(Board $board): Response
    {
        $this->authorize('view', $board);

        $board->load(['members:id,name,email,avatar_url', 'labels', 'workspace:id,name,owner_id']);

        return Inertia::render('Boards/Settings', [
            'board' => ['id' => $board->id, 'name' => $board->name],
            'workspace' => [
                'id' => $board->workspace->id,
                'name' => $board->workspace->name,
                'owner_id' => $board->workspace->owner_id,
            ],
            'isOwner' => $board->isOwnedBy(request()->user()->id),
            'members' => MemberResource::collection($board->members)->resolve(),
            'labels' => LabelResource::collection($board->labels)->resolve(),
        ]);
    }

    public function addMember(AddBoardMemberRequest $request, Board $board): RedirectResponse
    {
        $this->authorize('addMember', $board);

        $user = User::where('email', $request->validated('email'))->first();
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'Akun dengan email ini belum terdaftar di KurFlow.',
            ]);
        }

        if ($board->hasMember($user->id)) {
            throw ValidationException::withMessages([
                'email' => 'Pengguna ini sudah menjadi anggota board.',
            ]);
        }

        $board->members()->attach($user->id);

        return back()->with('success', 'Anggota ditambahkan ke board.');
    }

    public function createLabel(StoreLabelRequest $request, Board $board): RedirectResponse
    {
        $this->authorize('createLabel', $board);

        $exists = Label::where('board_id', $board->id)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($request->validated('name'))])
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => 'Label dengan nama ini sudah ada di board.',
            ]);
        }

        Label::create([
            'board_id' => $board->id,
            'name' => $request->validated('name'),
            'color' => $request->validated('color'),
        ]);

        return back()->with('success', 'Label dibuat.');
    }
}
