<?php

namespace App\Services\Auth;

use App\Models\Application;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * @return array{user: User, token: string}
     */
    public function login(string $email, string $password): array
    {
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['E-mail ou senha invalidos.'],
            ]);
        }

        $token = $user->createToken('senai-hub-api')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * @param  array{name: string, email: string, password: string}  $data
     * @return array{user: User, token: string}
     */
    public function register(array $data): array
    {
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'connect_aluno',
        ]);

        $connect = Application::query()->where('slug', 'connect')->first();

        if ($connect) {
            $user->applications()->sync([$connect->id]);
        }

        $token = $user->createToken('senai-hub-api')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    /**
     * @param  array{name: string, email: string}  $data
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        return $user->fresh();
    }

    public function updateAvatar(User $user, UploadedFile $file): User
    {
        $this->deleteStoredAvatar($user);

        $path = $file->store('avatars/'.$user->id, 'public');
        $url = Storage::disk('public')->url($path);

        $user->update(['avatar_url' => $url]);

        return $user->fresh();
    }

    public function removeAvatar(User $user): User
    {
        $this->deleteStoredAvatar($user);
        $user->update(['avatar_url' => null]);

        return $user->fresh();
    }

    private function deleteStoredAvatar(User $user): void
    {
        $avatarUrl = $user->avatar_url;

        if (! filled($avatarUrl)) {
            return;
        }

        $publicBase = rtrim(Storage::disk('public')->url(''), '/').'/';

        if (! str_starts_with($avatarUrl, $publicBase)) {
            return;
        }

        $relativePath = ltrim(substr($avatarUrl, strlen($publicBase)), '/');

        if ($relativePath !== '') {
            Storage::disk('public')->delete($relativePath);
        }
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Senha atual incorreta.'],
            ]);
        }

        $user->update([
            'password' => $newPassword,
        ]);
    }

    public function logout(?Authenticatable $user): void
    {
        if ($user instanceof User) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();
    }
}
