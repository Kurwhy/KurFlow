<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $commentsCount = $this->comments_count
            ?? ($this->relationLoaded('comments') ? $this->comments->count() : 0);

        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'column_id' => $this->column_id,
            'sprint_id' => $this->sprint_id,
            'assignee_id' => $this->assignee_id,
            'created_by' => $this->created_by,
            'title' => $this->title,
            'due_date' => $this->due_date?->toDateString(),
            'rank' => $this->rank,
            'label_ids' => $this->relationLoaded('labels')
                ? $this->labels->pluck('id')->values()->all()
                : $this->labels()->pluck('labels.id')->all(),
            'labels' => LabelResource::collection($this->whenLoaded('labels')),
            'comment_count' => (int) $commentsCount,
            'creator' => $this->whenLoaded('creator', fn () => new MemberResource($this->creator)),
            'assignee' => $this->whenLoaded('assignee', fn () => new MemberResource($this->assignee)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
