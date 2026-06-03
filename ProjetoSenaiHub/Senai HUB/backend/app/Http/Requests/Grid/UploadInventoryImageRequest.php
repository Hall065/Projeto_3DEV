<?php

namespace App\Http\Requests\Grid;

use Illuminate\Foundation\Http\FormRequest;

class UploadInventoryImageRequest extends FormRequest
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
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Selecione uma imagem para o item.',
            'image.image' => 'O arquivo deve ser uma imagem valida.',
            'image.mimes' => 'Use JPG, PNG, WebP ou GIF.',
            'image.max' => 'A imagem deve ter no maximo 2 MB.',
        ];
    }
}
