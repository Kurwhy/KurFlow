<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;

class MoveCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'column_id' => ['required', 'integer', 'exists:board_columns,id'],
            'rank' => ['required', 'string', 'max:64', 'regex:/^[0-9A-Za-z]+$/'],
            'before_card_id' => ['nullable', 'integer', 'exists:cards,id'],
            'after_card_id' => ['nullable', 'integer', 'exists:cards,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'column_id.required' => 'Kolom tujuan wajib diisi.',
            'column_id.exists' => 'Kolom tujuan tidak ditemukan.',
            'rank.required' => 'Rank wajib diisi.',
            'rank.regex' => 'Rank harus base-62 tanpa karakter lain.',
            'rank.max' => 'Rank maksimal 64 karakter.',
        ];
    }
}
