<?php

namespace App\Http\Requests\Column;

use Illuminate\Foundation\Http\FormRequest;

class StoreColumnRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:1', 'max:40'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama kolom wajib diisi, 1 sampai 40 karakter.',
            'name.min' => 'Nama kolom wajib diisi, 1 sampai 40 karakter.',
            'name.max' => 'Nama kolom wajib diisi, 1 sampai 40 karakter.',
        ];
    }
}
