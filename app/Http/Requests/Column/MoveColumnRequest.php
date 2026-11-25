<?php

namespace App\Http\Requests\Column;

use Illuminate\Foundation\Http\FormRequest;

class MoveColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rank' => ['required', 'string', 'max:64', 'regex:/^[0-9A-Za-z]+$/'],
            'before_column_id' => ['nullable', 'integer', 'exists:board_columns,id'],
            'after_column_id' => ['nullable', 'integer', 'exists:board_columns,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'rank.required' => 'Rank wajib diisi.',
            'rank.regex' => 'Rank harus base-62 tanpa karakter lain.',
            'rank.max' => 'Rank maksimal 64 karakter.',
        ];
    }
}
