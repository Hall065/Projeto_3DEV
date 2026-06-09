<?php

namespace App\Services\Grid;

use App\Models\Grid\GridTicket;
use App\Models\Grid\GridTicketAttachment;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Support\HubRole;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GridTicketAttachmentService
{
    public const MAX_ATTACHMENTS = 10;

    public function store(GridTicket $ticket, UploadedFile $file, ?User $user = null): GridTicketAttachment
    {
        if ($ticket->attachments()->count() >= self::MAX_ATTACHMENTS) {
            throw ValidationException::withMessages([
                'file' => 'Limite de '.self::MAX_ATTACHMENTS.' anexos por chamado.',
            ]);
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $file->storeAs('tickets/'.$ticket->id, $filename, 'public');

        return $ticket->attachments()->create([
            'uploaded_by_user_id' => $user?->id,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize() ?: 0,
            'disk_path' => $path,
        ]);
    }

    public function delete(GridTicketAttachment $attachment): void
    {
        if ($attachment->disk_path !== '') {
            Storage::disk('public')->delete($attachment->disk_path);
        }

        $attachment->delete();
    }

    public function deleteAllForTicket(GridTicket $ticket): void
    {
        $ticket->attachments()->each(fn (GridTicketAttachment $attachment) => $this->delete($attachment));
    }

    public function publicUrl(GridTicketAttachment $attachment): string
    {
        return Storage::disk('public')->url($attachment->disk_path);
    }

    public function canDelete(?User $user, GridTicketAttachment $attachment): bool
    {
        if (! $user) {
            return false;
        }

        if (HubRole::isAdmin($user->role)) {
            return true;
        }

        $permissions = app(PermissionService::class)->permissionsFor($user);

        if (in_array('*', $permissions, true) || in_array('grid.tickets.manage', $permissions, true)) {
            return true;
        }

        return $attachment->uploaded_by_user_id !== null
            && $attachment->uploaded_by_user_id === $user->id;
    }
}
