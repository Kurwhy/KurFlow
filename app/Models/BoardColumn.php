<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BoardColumn extends Model
{
    protected $fillable = ['board_id', 'name', 'rank'];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class, 'board_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class, 'column_id')->orderBy('rank');
    }
}
