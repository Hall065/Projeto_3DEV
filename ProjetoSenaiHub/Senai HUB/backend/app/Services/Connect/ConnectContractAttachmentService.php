<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectContractAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ConnectContractAttachmentService
{
    public const MAX_ATTACHMENTS = 5;

    public function store(ConnectContract $contract, UploadedFile $file, ?User $user = null, bool $isGenerated = false): ConnectContractAttachment
    {
        if ($contract->attachments()->count() >= self::MAX_ATTACHMENTS) {
            throw ValidationException::withMessages([
                'file' => 'Limite de '.self::MAX_ATTACHMENTS.' anexos por contrato.',
            ]);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $file->storeAs('contracts/'.$contract->id, $filename, 'public');

        return $contract->attachments()->create([
            'uploaded_by_user_id' => $user?->id,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize() ?: 0,
            'disk_path' => $path,
            'is_generated' => $isGenerated,
        ]);
    }

    public function storeFromContents(
        ConnectContract $contract,
        string $contents,
        string $originalName,
        string $mimeType,
        ?User $user = null,
        bool $isGenerated = false,
    ): ConnectContractAttachment {
        if ($contract->attachments()->count() >= self::MAX_ATTACHMENTS) {
            throw ValidationException::withMessages([
                'file' => 'Limite de '.self::MAX_ATTACHMENTS.' anexos por contrato.',
            ]);
        }

        $extension = pathinfo($originalName, PATHINFO_EXTENSION) ?: 'bin';
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'contracts/'.$contract->id.'/'.$filename;

        Storage::disk('public')->put($path, $contents);

        return $contract->attachments()->create([
            'uploaded_by_user_id' => $user?->id,
            'original_name' => $originalName,
            'mime_type' => $mimeType,
            'size_bytes' => strlen($contents),
            'disk_path' => $path,
            'is_generated' => $isGenerated,
        ]);
    }

    public function delete(ConnectContractAttachment $attachment): void
    {
        if ($attachment->disk_path !== '') {
            Storage::disk('public')->delete($attachment->disk_path);
        }

        $attachment->delete();
    }

    public function deleteAllForContract(ConnectContract $contract): void
    {
        $contract->attachments()->each(fn (ConnectContractAttachment $attachment) => $this->delete($attachment));
    }

    public function publicUrl(ConnectContractAttachment $attachment): string
    {
        return Storage::disk('public')->url($attachment->disk_path);
    }

    public function canDelete(?User $user, ConnectContractAttachment $attachment): bool
    {
        if (! $user) {
            return false;
        }

        $permissions = app(\App\Services\Auth\PermissionService::class)->permissionsFor($user);

        if (in_array('*', $permissions, true) || in_array('connect.contracts.manage', $permissions, true)) {
            return true;
        }

        return $attachment->uploaded_by_user_id !== null
            && $attachment->uploaded_by_user_id === $user->id;
    }
}
