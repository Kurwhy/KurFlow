<?php

namespace App\Http\Requests\Board;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabelRequest extends FormRequest
{
    public const COLORS = ['#E5484D', '#F59E0B', '#D4AF37', '#10B981', '#3E9BD6', '#A07CDB'];

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
            'name' => ['required', 'string', 'min:1', 'max:30'],
            'color' => ['required', 'string', Rule::in(self::COLORS)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama label wajib diisi, 1 sampai 30 karakter.',
            'name.min' => 'Nama label wajib diisi, 1 sampai 30 karakter.',
            'name.max' => 'Nama label wajib diisi, 1 sampai 30 karakter.',
            'color.required' => 'Warna label wajib dipilih.',
            'color.in' => 'Warna label harus salah satu dari 6 warna yang tersedia.',
        ];
    }
}
