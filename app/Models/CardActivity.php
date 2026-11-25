<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CardActivity extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'card_id',
        'user_id',
        'from_column_id',
        'to_column_id',
        'from_column_name',
        'to_column_name',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fromColumn(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'from_column_id');
    }

    public function toColumn(): BelongsTo
    {
        return $this->belongsTo(BoardColumn::class, 'to_column_id');
    }
}
