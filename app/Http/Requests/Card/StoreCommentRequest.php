<?php

namespace App\Http\Requests\Card;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->body)) {
            $this->merge(['body' => trim($this->body)]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required' => 'Komentar wajib diisi.',
            'body.min' => 'Komentar wajib diisi.',
            'body.max' => 'Komentar maksimal 2000 karakter.',
        ];
    }
}
