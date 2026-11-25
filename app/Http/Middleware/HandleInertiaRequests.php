<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                ] : null,
            ],
            'navigation' => fn () => $this->navigation($request),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function navigation(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return ['workspaces' => []];
        }

        $workspaces = Workspace::query()
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                    ->orWhereHas('boards.members', fn ($members) => $members->where('users.id', $user->id));
            })
            ->with([
                'boards' => fn ($query) => $query
                    ->whereHas('members', fn ($members) => $members->where('users.id', $user->id))
                    ->with(['sprints' => fn ($sprints) => $sprints->where('status', 'aktif')])
                    ->orderBy('name')
                    ->select('id', 'workspace_id', 'name'),
            ])
            ->orderBy('name')
            ->get();

        return [
            'workspaces' => $workspaces->map(fn (Workspace $workspace) => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'boards' => $workspace->boards->map(fn ($board) => [
                    'id' => $board->id,
                    'name' => $board->name,
                    'has_active_sprint' => $board->sprints->isNotEmpty(),
                ])->values(),
            ])->values(),
        ];
    }
}
