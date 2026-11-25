<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCardRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->title)) {
            $this->merge(['title' => trim($this->title)]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $card = $this->route('card');
        $boardId = $card->board_id;

        return [
            'title' => ['sometimes', 'required', 'string', 'min:1', 'max:200'],
            'assignee_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('board_members', 'user_id')->where('board_id', $boardId),
            ],
            'due_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'label_ids' => ['sometimes', 'array'],
            'label_ids.*' => [
                'integer',
                Rule::exists('labels', 'id')->where('board_id', $boardId),
            ],
            'sprint_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('sprints', 'id')->where(fn ($query) => $query->where('board_id', $boardId)->where('status', 'aktif')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
            'title.min' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
            'title.max' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
            'assignee_id.exists' => 'Assignee harus anggota board ini.',
            'due_date.date_format' => 'Format due date harus YYYY-MM-DD.',
            'label_ids.*.exists' => 'Label harus milik board yang sama.',
            'sprint_id.exists' => 'Kartu hanya bisa dimasukkan ke sprint aktif di board yang sama.',
        ];
    }
}
