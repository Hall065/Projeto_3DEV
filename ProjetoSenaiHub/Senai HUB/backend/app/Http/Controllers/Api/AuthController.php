<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\UploadAvatarRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
        );

        return response()->json([
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ],
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->sendPasswordResetLink($request->validated('email'));

        return response()->json([
            'message' => 'Se existir uma conta com este e-mail, enviaremos instruções para redefinir a senha.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword($request->validated());

        return response()->json([
            'message' => 'Senha redefinida com sucesso. Faça login com a nova senha.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile($request->user(), $request->validated());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Perfil atualizado com sucesso.',
        ]);
    }

    public function updateAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $this->authService->updateAvatar(
            $request->user(),
            $request->file('avatar'),
        );

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Foto de perfil atualizada com sucesso.',
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $this->authService->removeAvatar($request->user());

        return response()->json([
            'data' => new UserResource($user),
            'message' => 'Foto de perfil removida.',
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->authService->changePassword(
            $user,
            $request->validated('current_password'),
            $request->validated('password'),
        );

        app(\App\Services\Notification\SystemNotificationTriggers::class)->passwordChanged($user);

        return response()->json([
            'message' => 'Senha alterada com sucesso.',
        ]);
    }

    public function permissionsCatalog(): JsonResponse
    {
        return response()->json([
            'data' => [
                'roles' => config('permissions.roles', []),
                'role_permissions' => config('permissions.role_permissions', []),
                'nav_permissions' => config('permissions.nav_permissions', []),
                'application_slugs_by_role' => config('permissions.application_slugs_by_role', []),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}
