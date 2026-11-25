<?php

namespace App\Http\Requests\Board;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBoardRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama board wajib diisi, 3 sampai 60 karakter.',
            'name.min' => 'Nama board wajib diisi, 3 sampai 60 karakter.',
            'name.max' => 'Nama board wajib diisi, 3 sampai 60 karakter.',
        ];
    }
}
