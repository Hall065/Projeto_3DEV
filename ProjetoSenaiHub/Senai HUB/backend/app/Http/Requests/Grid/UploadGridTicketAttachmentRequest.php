<?php

namespace App\Http\Requests\Grid;

use Illuminate\Foundation\Http\FormRequest;

class UploadGridTicketAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,gif,pdf', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Selecione um arquivo para anexar.',
            'file.mimes' => 'Use imagem (JPG, PNG, WebP, GIF) ou PDF.',
            'file.max' => 'O arquivo deve ter no maximo 5 MB.',
        ];
    }
}
