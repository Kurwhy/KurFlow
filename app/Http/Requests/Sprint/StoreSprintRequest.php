<?php

namespace App\Http\Requests\Sprint;

use Illuminate\Foundation\Http\FormRequest;

class StoreSprintRequest extends FormRequest
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
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama sprint wajib diisi, 3 sampai 60 karakter.',
            'name.min' => 'Nama sprint wajib diisi, 3 sampai 60 karakter.',
            'name.max' => 'Nama sprint wajib diisi, 3 sampai 60 karakter.',
            'start_date.required' => 'Tanggal mulai wajib diisi.',
            'start_date.date_format' => 'Format tanggal mulai harus YYYY-MM-DD.',
            'end_date.required' => 'Tanggal selesai wajib diisi.',
            'end_date.date_format' => 'Format tanggal selesai harus YYYY-MM-DD.',
            'end_date.after_or_equal' => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        ];
    }
}
