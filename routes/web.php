<?php

use App\Http\Controllers\Api\BoardStateController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\SprintController;
use App\Http\Controllers\BoardController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/workspaces');

require __DIR__.'/auth.php';

Route::middleware('auth')->group(function () {
    Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::post('/workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');
    Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show'])->name('workspaces.show');
    Route::patch('/workspaces/{workspace}', [WorkspaceController::class, 'update'])->name('workspaces.update');
    Route::post('/workspaces/{workspace}/boards', [BoardController::class, 'store'])->name('boards.store');

    Route::get('/boards/{board}', [BoardController::class, 'show'])->name('boards.show');
    Route::patch('/boards/{board}', [BoardController::class, 'update'])->name('boards.update');
    Route::get('/boards/{board}/sprints', [BoardController::class, 'sprints'])->name('boards.sprints');
    Route::get('/boards/{board}/settings', [BoardController::class, 'settings'])->name('boards.settings');
    Route::post('/boards/{board}/members', [BoardController::class, 'addMember'])->name('boards.members.store');
    Route::post('/boards/{board}/labels', [BoardController::class, 'createLabel'])->name('boards.labels.store');

    Route::prefix('api')->group(function () {
        Route::get('/boards/{board}/state', [BoardStateController::class, 'show']);

        Route::post('/boards/{board}/columns', [ColumnController::class, 'store']);
        Route::patch('/columns/{column}', [ColumnController::class, 'update']);
        Route::patch('/columns/{column}/move', [ColumnController::class, 'move']);

        Route::post('/boards/{board}/cards', [CardController::class, 'store']);
        Route::get('/cards/{card}', [CardController::class, 'show']);
        Route::patch('/cards/{card}', [CardController::class, 'update']);
        Route::patch('/cards/{card}/move', [CardController::class, 'move']);
        Route::post('/cards/{card}/comments', [CardController::class, 'comment']);

        Route::post('/boards/{board}/sprints', [SprintController::class, 'store']);
        Route::post('/sprints/{sprint}/start', [SprintController::class, 'start']);
        Route::post('/sprints/{sprint}/complete', [SprintController::class, 'complete']);
    });
});
