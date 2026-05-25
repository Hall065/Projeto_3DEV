<?php

namespace App\Services\Auth;

use App\Models\Application;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            'role' => 'student',
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

    public function logout(?Authenticatable $user): void
    {
        if ($user instanceof User) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout();
    }
}
