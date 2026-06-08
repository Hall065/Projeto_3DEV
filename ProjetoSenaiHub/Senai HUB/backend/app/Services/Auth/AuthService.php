<?php

namespace App\Services\Auth;

use App\Models\Application;
use App\Models\Connect\ConnectStudent;
use App\Models\HubPerson;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
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
        $user = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'connect_aluno',
            ]);

            $person = HubPerson::query()->create([
                'kind' => 'student',
                'user_id' => $user->id,
                'full_name' => $data['name'],
                'email' => $data['email'],
                'status' => 'active',
            ]);

            ConnectStudent::query()->create([
                'hub_person_id' => $person->id,
                'user_id' => $user->id,
                'full_name' => $data['name'],
                'email' => $data['email'],
                'status' => 'active',
            ]);

            $connect = Application::query()->where('slug', 'connect')->first();
            if ($connect) {
                $user->applications()->sync([$connect->id]);
            }

            return $user;
        });

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

        $user->update(['avatar_url' => '/storage/'.$path]);

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

        $relativePath = $this->avatarStoragePath($avatarUrl);

        if ($relativePath === null) {
            return;
        }

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

    private function avatarStoragePath(string $avatarUrl): ?string
    {
        if (str_starts_with($avatarUrl, '/storage/')) {
            return ltrim(substr($avatarUrl, strlen('/storage/')), '/');
        }

        $publicBase = rtrim(Storage::disk('public')->url(''), '/').'/';

        if (str_starts_with($avatarUrl, $publicBase)) {
            return ltrim(substr($avatarUrl, strlen($publicBase)), '/');
        }

        $parsedPath = parse_url($avatarUrl, PHP_URL_PATH);

        if (is_string($parsedPath) && str_starts_with($parsedPath, '/storage/')) {
            return ltrim(substr($parsedPath, strlen('/storage/')), '/');
        }

        return null;
    }

    public function logout(?Authenticatable $user): void
    {
        if ($user instanceof User) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();
    }
}
