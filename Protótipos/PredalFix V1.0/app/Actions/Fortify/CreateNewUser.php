<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'cpf' => ['required', 'string', 'max:14', 'unique:users,cpf', 'unique:usuarios,cpf'],
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'cpf' => $input['cpf'],
                'tipo' => 'colaborador',
                'ativo' => true,
                'password' => $input['password'],
            ]);

            $usuario = Usuario::firstOrNew(['email' => $input['email']]);
            $usuario->forceFill([
                'id' => $usuario->exists ? $usuario->id : $user->id,
                'nome' => $input['name'],
                'email' => $input['email'],
                'cpf' => $input['cpf'],
                'password' => Hash::make($input['password']),
                'perfil_acesso' => 'cliente',
                'ativo' => true,
            ])->save();

            return $user;
        });
    }
}
