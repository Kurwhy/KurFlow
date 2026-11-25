<?php

namespace Tests\Feature;

use App\Models\Label;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesKurflowBoard;
use Tests\TestCase;

class KurflowPagesTest extends TestCase
{
    use CreatesKurflowBoard;
    use RefreshDatabase;

    public function test_pages_render_for_board_member(): void
    {
        ['member' => $member, 'workspace' => $workspace, 'board' => $board] = $this->makeScenario();

        $this->actingAs($member);

        foreach ([
            '/workspaces',
            "/workspaces/{$workspace->id}",
            "/boards/{$board->id}",
            "/boards/{$board->id}/sprints",
            "/boards/{$board->id}/settings",
        ] as $path) {
            $this->get($path)->assertOk()->assertSee('KurFlow');
        }
    }

    public function test_non_member_cannot_open_workspace_or_board(): void
    {
        ['outsider' => $outsider, 'workspace' => $workspace, 'board' => $board] = $this->makeScenario();

        $this->actingAs($outsider)->get("/workspaces/{$workspace->id}")->assertForbidden();
        $this->actingAs($outsider)->get("/boards/{$board->id}")->assertForbidden();
    }

    public function test_board_member_cannot_manage_owner_actions(): void
    {
        ['member' => $member, 'outsider' => $outsider, 'workspace' => $workspace, 'board' => $board] = $this->makeScenario();

        $this->actingAs($member)->patch("/boards/{$board->id}", ['name' => 'Nama Baru'])->assertForbidden();
        $this->actingAs($member)->post("/boards/{$board->id}/members", ['email' => $outsider->email])->assertForbidden();
        $this->actingAs($member)->patch("/workspaces/{$workspace->id}", ['name' => 'Nama Baru'])->assertForbidden();
        $this->actingAs($member)->post("/workspaces/{$workspace->id}/boards", ['name' => 'Board Baru'])->assertForbidden();
    }

    public function test_owner_creates_workspace_and_board_with_default_columns(): void
    {
        $owner = \App\Models\User::create([
            'name' => 'Rizky Pratama',
            'email' => 'pemilik@example.test',
            'password' => 'password',
        ]);

        $this->actingAs($owner)->post('/workspaces', ['name' => 'Workspace Baru'])
            ->assertRedirect();

        $workspace = \App\Models\Workspace::where('name', 'Workspace Baru')->firstOrFail();

        $this->actingAs($owner)->post("/workspaces/{$workspace->id}/boards", ['name' => 'Board Baru'])
            ->assertRedirect();

        $board = \App\Models\Board::where('name', 'Board Baru')->firstOrFail();
        $this->assertTrue($board->hasMember($owner->id));
        $this->assertSame(
            ['Backlog', 'Dikerjakan', 'Review Kode', 'Selesai'],
            $board->columns()->pluck('name')->all(),
        );
    }

    public function test_board_member_can_create_label(): void
    {
        ['member' => $member, 'board' => $board] = $this->makeScenario();

        $this->actingAs($member)->post("/boards/{$board->id}/labels", [
            'name' => 'Riset',
            'color' => '#A07CDB',
        ])->assertRedirect();

        $this->assertDatabaseHas('labels', [
            'board_id' => $board->id,
            'name' => 'Riset',
            'color' => '#A07CDB',
        ]);
    }

    public function test_add_member_by_email_and_duplicate_label_validation(): void
    {
        ['owner' => $owner, 'outsider' => $outsider, 'board' => $board] = $this->makeScenario();

        $this->actingAs($owner)->post("/boards/{$board->id}/members", [
            'email' => 'tidak.ada@example.test',
        ])->assertSessionHasErrors(['email' => 'Akun dengan email ini belum terdaftar di KurFlow.']);

        $this->actingAs($owner)->post("/boards/{$board->id}/members", [
            'email' => $outsider->email,
        ])->assertRedirect();
        $this->assertTrue($board->hasMember($outsider->id));

        Label::create(['board_id' => $board->id, 'name' => 'Bug', 'color' => '#E5484D']);

        $this->actingAs($owner)->post("/boards/{$board->id}/labels", [
            'name' => 'bug',
            'color' => '#D4AF37',
        ])->assertSessionHasErrors(['name' => 'Label dengan nama ini sudah ada di board.']);
    }
}
