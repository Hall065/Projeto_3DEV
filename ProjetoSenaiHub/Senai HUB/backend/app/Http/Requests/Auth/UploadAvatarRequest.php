<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
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
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Selecione uma imagem para a foto de perfil.',
            'avatar.image' => 'O arquivo deve ser uma imagem valida.',
            'avatar.mimes' => 'Use JPG, PNG, WebP ou GIF.',
            'avatar.max' => 'A imagem deve ter no maximo 2 MB.',
        ];
    }
}
