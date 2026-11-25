<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();
        });

        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->timestamps();
        });

        Schema::create('board_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['board_id', 'user_id']);
        });

        Schema::create('board_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('name', 40);
            $table->string('rank', 64)->collation('utf8mb4_bin');
            $table->timestamps();
            $table->unique(['board_id', 'rank']);
        });

        Schema::create('sprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['direncanakan', 'aktif', 'selesai'])->default('direncanakan');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['board_id', 'status']);
        });

        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->foreignId('column_id')->constrained('board_columns')->cascadeOnDelete();
            $table->foreignId('sprint_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('title', 200);
            $table->date('due_date')->nullable();
            $table->string('rank', 64)->collation('utf8mb4_bin');
            $table->timestamps();
            $table->unique(['column_id', 'rank']);
            $table->index(['board_id', 'sprint_id']);
        });

        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('name', 30);
            $table->enum('color', ['#E5484D', '#F59E0B', '#D4AF37', '#10B981', '#3E9BD6', '#A07CDB']);
            $table->timestamps();
            $table->unique(['board_id', 'name']);
        });

        Schema::create('card_label', function (Blueprint $table) {
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('label_id')->constrained()->cascadeOnDelete();
            $table->primary(['card_id', 'label_id']);
        });

        Schema::create('card_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->text('body');
            $table->timestamps();
            $table->index(['card_id', 'created_at']);
        });

        Schema::create('card_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('from_column_id')->nullable()->constrained('board_columns')->nullOnDelete();
            $table->foreignId('to_column_id')->nullable()->constrained('board_columns')->nullOnDelete();
            $table->string('from_column_name', 40);
            $table->string('to_column_name', 40);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['card_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['card_activities', 'card_comments', 'card_label', 'labels', 'cards', 'sprints', 'board_columns', 'board_members', 'boards', 'workspaces'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
