<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    protected $fillable = ['workspace_id', 'name'];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'board_members')->withTimestamps();
    }

    public function columns(): HasMany
    {
        return $this->hasMany(BoardColumn::class)->orderBy('rank');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class);
    }

    public function labels(): HasMany
    {
        return $this->hasMany(Label::class)->orderBy('name');
    }

    public function activeSprint(): ?Sprint
    {
        return $this->sprints()->where('status', 'aktif')->first();
    }

    public function hasMember(int $userId): bool
    {
        return $this->members()->whereKey($userId)->exists();
    }

    public function isOwnedBy(int $userId): bool
    {
        return (int) $this->workspace()->value('owner_id') === $userId;
    }
}
