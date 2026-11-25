<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Services\BoardStateService;
use Illuminate\Http\JsonResponse;

class BoardStateController extends Controller
{
    public function show(Board $board): JsonResponse
    {
        $this->authorize('view', $board);

        return response()->json(BoardStateService::payload($board));
    }
}
