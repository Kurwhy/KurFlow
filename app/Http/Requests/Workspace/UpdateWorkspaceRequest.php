<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceRequest extends FormRequest
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
            'name.required' => 'Nama workspace wajib diisi, 3 sampai 60 karakter.',
            'name.min' => 'Nama workspace wajib diisi, 3 sampai 60 karakter.',
            'name.max' => 'Nama workspace wajib diisi, 3 sampai 60 karakter.',
        ];
    }
}
