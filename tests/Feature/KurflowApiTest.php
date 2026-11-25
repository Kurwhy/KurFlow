<?php

namespace Tests\Feature;

use App\Events\CardActivityCreated;
use App\Events\CardMoved;
use App\Events\CardUpdated;
use App\Events\ColumnMoved;
use App\Events\CommentCreated;
use App\Models\Card;
use App\Models\CardActivity;
use App\Models\CardComment;
use App\Models\Label;
use App\Models\Sprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\Concerns\CreatesKurflowBoard;
use Tests\TestCase;

class KurflowApiTest extends TestCase
{
    use CreatesKurflowBoard;
    use RefreshDatabase;

    public function test_non_member_cannot_access_board_or_mutate_cards(): void
    {
        ['outsider' => $outsider, 'board' => $board, 'card' => $card] = $this->makeScenario();

        $this->actingAs($outsider)->getJson("/api/boards/{$board->id}/state")->assertForbidden();
        $this->actingAs($outsider)->patchJson("/api/cards/{$card->id}/move", [
            'column_id' => $board->columns()->first()->id,
            'rank' => 'a0',
        ])->assertForbidden();
        $this->actingAs($outsider)->postJson("/api/cards/{$card->id}/comments", [
            'body' => 'Halo',
        ])->assertForbidden();
    }

    public function test_card_move_updates_one_row_and_records_activity(): void
    {
        ['member' => $member, 'board' => $board, 'backlog' => $backlog, 'done' => $done, 'card' => $card, 'otherCard' => $otherCard] = $this->makeScenario();

        Event::fake([CardMoved::class, CardActivityCreated::class]);

        $otherUpdatedAt = $otherCard->updated_at;

        $response = $this->actingAs($member)->patchJson("/api/cards/{$card->id}/move", [
            'column_id' => $done->id,
            'rank' => 'a0',
            'before_card_id' => null,
            'after_card_id' => null,
        ]);

        $response->assertOk()->assertJsonPath('card.column_id', $done->id);

        $card->refresh();
        $this->assertSame($done->id, $card->column_id);
        $this->assertSame('a0', $card->rank);
        $this->assertSame($otherUpdatedAt->toDateTimeString(), $otherCard->refresh()->updated_at->toDateTimeString());
        $this->assertDatabaseHas('card_activities', [
            'card_id' => $card->id,
            'from_column_id' => $backlog->id,
            'to_column_id' => $done->id,
            'from_column_name' => 'Backlog',
            'to_column_name' => 'Selesai',
        ]);

        Event::assertDispatched(CardMoved::class);
        Event::assertDispatched(CardActivityCreated::class);
    }

    public function test_same_column_move_does_not_record_activity(): void
    {
        ['member' => $member, 'backlog' => $backlog, 'card' => $card, 'otherCard' => $otherCard] = $this->makeScenario();

        $this->actingAs($member)->patchJson("/api/cards/{$card->id}/move", [
            'column_id' => $backlog->id,
            'rank' => \App\Support\RankService::after($otherCard->rank),
            'before_card_id' => $otherCard->id,
            'after_card_id' => null,
        ])->assertOk();

        $this->assertDatabaseCount('card_activities', 0);
    }

    public function test_server_recalculates_rank_that_is_not_between_neighbors(): void
    {
        ['member' => $member, 'done' => $done, 'card' => $card] = $this->makeScenario();

        $first = Card::create([
            'board_id' => $done->board_id,
            'column_id' => $done->id,
            'created_by' => $member->id,
            'title' => 'Pertama',
            'rank' => 'a0',
        ]);
        $second = Card::create([
            'board_id' => $done->board_id,
            'column_id' => $done->id,
            'created_by' => $member->id,
            'title' => 'Kedua',
            'rank' => 'a1',
        ]);

        $response = $this->actingAs($member)->patchJson("/api/cards/{$card->id}/move", [
            'column_id' => $done->id,
            'rank' => 'zzz',
            'before_card_id' => $first->id,
            'after_card_id' => $second->id,
        ])->assertOk();

        $rank = $response->json('rank');
        $this->assertTrue(\App\Support\RankService::isBetween($rank, $first->rank, $second->rank));
    }

    public function test_column_move_updates_one_row_and_broadcasts(): void
    {
        ['member' => $member, 'board' => $board, 'backlog' => $backlog, 'done' => $done] = $this->makeScenario();

        $done->forceFill(['updated_at' => '2020-01-01 00:00:00'])->saveQuietly();
        $doneUpdatedAt = $done->updated_at;

        Event::fake([ColumnMoved::class]);

        $this->actingAs($member)->patchJson("/api/columns/{$backlog->id}/move", [
            'rank' => 'a2',
            'before_column_id' => $done->id,
            'after_column_id' => null,
        ])->assertOk();

        $this->assertSame('a2', $backlog->refresh()->rank);
        $this->assertSame($doneUpdatedAt->toDateTimeString(), $done->refresh()->updated_at->toDateTimeString());
        Event::assertDispatched(ColumnMoved::class);
    }

    public function test_assignee_must_be_board_member(): void
    {
        ['member' => $member, 'outsider' => $outsider, 'card' => $card] = $this->makeScenario();

        Event::fake([CardUpdated::class]);

        $this->actingAs($member)->patchJson("/api/cards/{$card->id}", [
            'assignee_id' => $outsider->id,
        ])->assertStatus(422)->assertJsonValidationErrors('assignee_id');

        $this->actingAs($member)->patchJson("/api/cards/{$card->id}", [
            'assignee_id' => $member->id,
            'due_date' => '2026-12-01',
        ])->assertOk()->assertJsonPath('card.assignee_id', $member->id);

        Event::assertDispatched(CardUpdated::class);
    }

    public function test_card_creation_appends_rank_and_rejects_whitespace_comment(): void
    {
        ['member' => $member, 'board' => $board, 'done' => $done, 'card' => $card] = $this->makeScenario();

        $first = $this->actingAs($member)->postJson("/api/boards/{$board->id}/cards", [
            'column_id' => $done->id,
            'title' => 'Kartu A',
        ])->assertCreated();

        $second = $this->actingAs($member)->postJson("/api/boards/{$board->id}/cards", [
            'column_id' => $done->id,
            'title' => 'Kartu B',
        ])->assertCreated();

        $this->assertSame('a0', $first->json('card.rank'));
        $this->assertSame('a1', $second->json('card.rank'));

        $this->actingAs($member)->postJson("/api/cards/{$card->id}/comments", [
            'body' => '   ',
        ])->assertStatus(422)->assertJsonValidationErrors('body');
    }

    public function test_completing_sprint_keeps_card_sprint_reference(): void
    {
        ['member' => $member, 'board' => $board, 'card' => $card] = $this->makeScenario();

        $sprint = Sprint::create([
            'board_id' => $board->id,
            'name' => 'Sprint Aktif',
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-14',
            'status' => 'aktif',
            'started_at' => now(),
        ]);
        $card->update(['sprint_id' => $sprint->id]);

        $this->actingAs($member)->postJson("/api/sprints/{$sprint->id}/complete")->assertOk();

        $this->assertSame('selesai', $sprint->refresh()->status);
        $this->assertSame($sprint->id, $card->refresh()->sprint_id);
    }

    public function test_comment_limit_and_realtime_event(): void
    {
        ['member' => $member, 'card' => $card] = $this->makeScenario();

        $this->actingAs($member)->postJson("/api/cards/{$card->id}/comments", [
            'body' => str_repeat('a', 2001),
        ])->assertStatus(422);

        Event::fake([CommentCreated::class]);

        $response = $this->actingAs($member)->postJson("/api/cards/{$card->id}/comments", [
            'body' => 'Sudah saya cek.',
        ])->assertCreated();

        $this->assertSame(1, $response->json('comment_count'));
        $this->assertDatabaseHas('card_comments', ['card_id' => $card->id, 'body' => 'Sudah saya cek.']);
        Event::assertDispatched(CommentCreated::class);
    }

    public function test_only_one_sprint_can_be_active(): void
    {
        ['member' => $member, 'board' => $board] = $this->makeScenario();

        $first = Sprint::create([
            'board_id' => $board->id,
            'name' => 'Sprint 1',
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-14',
            'status' => 'direncanakan',
        ]);
        $second = Sprint::create([
            'board_id' => $board->id,
            'name' => 'Sprint 2',
            'start_date' => '2026-01-15',
            'end_date' => '2026-01-28',
            'status' => 'direncanakan',
        ]);

        $this->actingAs($member)->postJson("/api/sprints/{$first->id}/start")->assertOk();
        $this->actingAs($member)->postJson("/api/sprints/{$second->id}/start")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sprint' => 'Selesaikan sprint aktif terlebih dahulu.']);

        $this->actingAs($member)->postJson("/api/sprints/{$first->id}/complete")->assertOk();
        $this->actingAs($member)->postJson("/api/sprints/{$second->id}/start")->assertOk();

        $this->assertSame('selesai', $first->refresh()->status);
        $this->assertSame('aktif', $second->refresh()->status);
    }

    public function test_card_can_only_join_active_sprint_of_same_board(): void
    {
        ['member' => $member, 'board' => $board, 'card' => $card] = $this->makeScenario();

        $planned = Sprint::create([
            'board_id' => $board->id,
            'name' => 'Sprint Rencana',
            'start_date' => '2026-02-01',
            'end_date' => '2026-02-14',
            'status' => 'direncanakan',
        ]);

        $this->actingAs($member)->patchJson("/api/cards/{$card->id}", [
            'sprint_id' => $planned->id,
        ])->assertStatus(422)->assertJsonValidationErrors('sprint_id');

        $planned->update(['status' => 'aktif']);

        $this->actingAs($member)->patchJson("/api/cards/{$card->id}", [
            'sprint_id' => $planned->id,
        ])->assertOk()->assertJsonPath('card.sprint_id', $planned->id);
    }
}
