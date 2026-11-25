<?php

namespace App\Http\Controllers;

use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $workspaces = Workspace::query()
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                    ->orWhereHas('boards.members', fn ($members) => $members->where('users.id', $user->id));
            })
            ->with('owner:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Workspaces/Index', [
            'workspaces' => $workspaces->map(function (Workspace $workspace) use ($user) {
                $isOwner = (int) $workspace->owner_id === (int) $user->id;

                $boardsCount = $workspace->boards()
                    ->when(! $isOwner, fn ($query) => $query->whereHas('members', fn ($members) => $members->where('users.id', $user->id)))
                    ->count();

                return [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'owner_name' => $workspace->owner?->name,
                    'boards_count' => $boardsCount,
                ];
            })->values(),
        ]);
    }

    public function show(Request $request, Workspace $workspace): Response
    {
        $this->authorize('view', $workspace);

        $user = $request->user();
        $isOwner = (int) $workspace->owner_id === (int) $user->id;

        $boards = $workspace->boards()
            ->when(! $isOwner, fn ($query) => $query->whereHas('members', fn ($members) => $members->where('users.id', $user->id)))
            ->withCount('cards')
            ->with([
                'members:id,name,avatar_url',
                'sprints' => fn ($query) => $query->where('status', 'aktif'),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('Workspaces/Show', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'owner_id' => $workspace->owner_id,
                'owner_name' => $workspace->owner()->value('name'),
            ],
            'isOwner' => $isOwner,
            'boards' => $boards->map(fn ($board) => [
                'id' => $board->id,
                'name' => $board->name,
                'cards_count' => $board->cards_count,
                'active_sprint_name' => $board->sprints->first()?->name,
                'members' => $board->members->map(fn ($member) => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'avatar_url' => $member->avatar_url,
                ])->values(),
            ])->values(),
        ]);
    }

    public function store(StoreWorkspaceRequest $request): RedirectResponse
    {
        $workspace = Workspace::create([
            'owner_id' => $request->user()->id,
            'name' => $request->validated('name'),
        ]);

        return redirect()->route('workspaces.show', $workspace)->with('success', 'Workspace dibuat.');
    }

    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): RedirectResponse
    {
        $this->authorize('update', $workspace);

        $workspace->update(['name' => $request->validated('name')]);

        return back()->with('success', 'Nama workspace diperbarui.');
    }
}
