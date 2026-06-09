<?php

namespace Tests\Feature;

use App\Models\Grid\GridTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GridTicketAttachmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_attachment_can_be_uploaded_and_listed(): void
    {
        $this->seed();
        Storage::fake('public');

        $manager = User::query()->where('email', 'joao.chefe@grid.senai.local')->firstOrFail();
        Sanctum::actingAs($manager);

        $ticket = GridTicket::query()->firstOrFail();

        $response = $this->postJson("/api/grid/tickets/{$ticket->id}/attachments", [
            'file' => UploadedFile::fake()->create('problema.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'problema.jpg')
            ->assertJsonPath('data.is_image', true)
            ->assertJsonStructure(['data' => ['id', 'url', 'is_image']]);

        $show = $this->getJson("/api/grid/tickets/{$ticket->id}");

        $show->assertOk()
            ->assertJsonCount(1, 'data.attachments');
    }

    public function test_uploader_can_delete_own_attachment(): void
    {
        $this->seed();
        Storage::fake('public');

        $secretaria = User::query()->where('email', 'sandra.secretaria@grid.senai.local')->firstOrFail();
        Sanctum::actingAs($secretaria);

        $ticket = $this->postJson('/api/grid/tickets', [
            'requester' => $secretaria->name,
            'title' => 'Chamado com anexo de teste',
            'summary' => 'Teste de remocao de anexo',
        ])->assertCreated()->json('data');

        $ticketId = (int) $ticket['id'];

        $upload = $this->postJson("/api/grid/tickets/{$ticketId}/attachments", [
            'file' => UploadedFile::fake()->create('laudo.pdf', 120, 'application/pdf'),
        ]);

        $attachmentId = (int) $upload->json('data.id');

        $this->deleteJson("/api/grid/tickets/{$ticketId}/attachments/{$attachmentId}")
            ->assertOk();

        $this->getJson("/api/grid/tickets/{$ticketId}")
            ->assertOk()
            ->assertJsonCount(0, 'data.attachments');
    }
}
