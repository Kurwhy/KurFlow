<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'card_id' => $this->card_id,
            'from_column_id' => $this->from_column_id,
            'to_column_id' => $this->to_column_id,
            'from_column_name' => $this->from_column_name,
            'to_column_name' => $this->to_column_name,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => new MemberResource($this->whenLoaded('user')),
        ];
    }
}
