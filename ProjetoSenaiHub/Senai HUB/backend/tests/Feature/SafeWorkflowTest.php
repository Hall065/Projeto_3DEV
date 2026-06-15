<?php

namespace Tests\Feature;

use App\Enums\Safe\AuthorizationStatus;
use App\Models\Safe\SafeAuthorization;
use App\Models\Safe\SafeStudent;
use App\Mail\HubNotificationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SafeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_exit_authorization_sends_notification_email(): void
    {
        Mail::fake();
        $this->seed();

        $aqv = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        $student = SafeStudent::query()->where('registration', '2025AUT0003')->firstOrFail();

        Sanctum::actingAs($aqv);

        $scheduled = now()->addHour();

        $this->postJson('/api/safe/authorizations', [
            'safe_student_id' => $student->id,
            'type' => 'saida',
            'reason' => 'Consulta medica teste',
            'absence_count' => 1,
            'date' => $scheduled->format('Y-m-d'),
            'time' => $scheduled->format('H:i'),
        ])->assertCreated();

        Mail::assertSent(HubNotificationMail::class);
    }

    public function test_exit_authorization_flow_aqv_teacher_portaria(): void
    {
        $this->seed();

        $aqv = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        $professor = User::query()->where('email', 'marcos.professor@safe.senai.local')->firstOrFail();
        $portaria = User::query()->where('email', 'helena.portaria@safe.senai.local')->firstOrFail();
        $student = SafeStudent::query()->where('registration', '2025AUT0003')->firstOrFail();

        Sanctum::actingAs($aqv);

        $scheduled = now()->addHour();

        $create = $this->postJson('/api/safe/authorizations', [
            'safe_student_id' => $student->id,
            'type' => 'saida',
            'reason' => 'Consulta medica teste',
            'absence_count' => 1,
            'date' => $scheduled->format('Y-m-d'),
            'time' => $scheduled->format('H:i'),
        ]);

        $create->assertCreated();
        $authorizationId = $create->json('data.id');

        $this->assertDatabaseHas('safe_authorizations', [
            'id' => $authorizationId,
            'status' => AuthorizationStatus::AguardandoProfessor->value,
        ]);

        Sanctum::actingAs($professor);

        $this->postJson("/api/safe/teacher/authorizations/{$authorizationId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', AuthorizationStatus::LiberadoPortaria->value);

        Sanctum::actingAs($portaria);

        $this->postJson("/api/safe/portaria/authorizations/{$authorizationId}/confirm")
            ->assertOk()
            ->assertJsonPath('data.status', AuthorizationStatus::Finalizado->value);

        $authorization = SafeAuthorization::query()->findOrFail($authorizationId);
        $this->assertNotNull($authorization->finalized_at);
    }

    public function test_entry_authorization_finalizes_on_teacher_approval(): void
    {
        $this->seed();

        $aqv = User::query()->where('email', 'ana.aqv@safe.senai.local')->firstOrFail();
        $professor = User::query()->where('email', 'marcos.professor@safe.senai.local')->firstOrFail();
        $student = SafeStudent::query()->where('registration', '2025AUT0021')->firstOrFail();

        Sanctum::actingAs($aqv);

        $scheduled = now()->addMinutes(15);

        $create = $this->postJson('/api/safe/authorizations', [
            'safe_student_id' => $student->id,
            'type' => 'entrada',
            'reason' => 'Retorno apos consulta',
            'date' => $scheduled->format('Y-m-d'),
            'time' => $scheduled->format('H:i'),
        ])->assertCreated();

        $authorizationId = $create->json('data.id');

        Sanctum::actingAs($professor);

        $this->postJson("/api/safe/teacher/authorizations/{$authorizationId}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', AuthorizationStatus::Finalizado->value);
    }
}
