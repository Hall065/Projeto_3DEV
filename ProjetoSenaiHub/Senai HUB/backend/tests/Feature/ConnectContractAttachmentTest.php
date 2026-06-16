<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectStudent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ConnectContractAttachmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_and_generate_contract_attachment(): void
    {
        $this->seed();
        Storage::fake('public');

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $student = ConnectStudent::query()->firstOrFail();

        $contract = ConnectContract::query()->create([
            'connect_student_id' => $student->id,
            'contract_type' => 'aprendizagem',
            'weekly_hours' => 8,
            'start_date' => now()->toDateString(),
            'monthly_value' => 1200,
            'company_name' => 'Empresa Teste Ltda',
            'company_email' => 'rh@empresa.test',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/connect/contracts/{$contract->id}/attachments", [
                'file' => UploadedFile::fake()->create('contrato-assinado.pdf', 120, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.original_name', 'contrato-assinado.pdf');

        $this->actingAs($admin)
            ->postJson("/api/connect/contracts/{$contract->id}/generate-document", [
                'replace_existing' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.is_generated', true)
            ->assertJsonPath('data.mime_type', 'application/pdf');

        $this->assertDatabaseCount('connect_contract_attachments', 2);
    }

    public function test_store_contract_can_generate_document_on_create(): void
    {
        $this->seed();
        Storage::fake('public');

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $student = ConnectStudent::query()->firstOrFail();

        $response = $this->actingAs($admin)
            ->postJson('/api/connect/contracts', [
                'connect_student_id' => $student->id,
                'contract_type' => 'estagio',
                'weekly_hours' => 6,
                'start_date' => now()->toDateString(),
                'monthly_value' => 900,
                'company_name' => 'Industria Exemplo SA',
                'generate_document' => true,
            ])
            ->assertCreated();

        $contractId = (int) $response->json('data.id');

        $this->assertDatabaseHas('connect_contract_attachments', [
            'connect_contract_id' => $contractId,
            'is_generated' => true,
            'mime_type' => 'application/pdf',
        ]);
    }
}
