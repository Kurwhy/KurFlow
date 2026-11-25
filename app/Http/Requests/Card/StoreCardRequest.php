<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCardRequest extends FormRequest
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
        $boardId = $this->route('board')->id;

        return [
            'column_id' => [
                'required',
                'integer',
                Rule::exists('board_columns', 'id')->where('board_id', $boardId),
            ],
            'title' => ['required', 'string', 'min:1', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'column_id.required' => 'Kolom tujuan wajib dipilih.',
            'column_id.exists' => 'Kolom tidak ada di board ini.',
            'title.required' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
            'title.min' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
            'title.max' => 'Judul kartu wajib diisi, 1 sampai 200 karakter.',
        ];
    }
}
