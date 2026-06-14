<?php

namespace Database\Seeders;

use App\Enums\Safe\AuthorizationStatus;
use App\Enums\Safe\AuthorizationType;
use App\Models\Safe\SafeAuthorization;
use App\Models\Safe\SafeAuthorizationLog;
use App\Models\Safe\SafeStudent;
use App\Models\User;
use App\Support\HubRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SafeSeeder extends Seeder
{
    public function run(): void
    {
        $aqv = User::query()->updateOrCreate(
            ['email' => 'ana.aqv@safe.senai.local'],
            [
                'name' => 'Ana AQV',
                'password' => Hash::make('password123'),
                'role' => HubRole::SAFE_AQV,
                'custom_permissions' => null,
                'email_verified_at' => now(),
            ],
        );

        $professor = User::query()->updateOrCreate(
            ['email' => 'marcos.professor@safe.senai.local'],
            [
                'name' => 'Marcos Professor',
                'password' => Hash::make('password123'),
                'role' => HubRole::SAFE_PROFESSOR,
                'custom_permissions' => null,
                'email_verified_at' => now(),
            ],
        );

        $portaria = User::query()->updateOrCreate(
            ['email' => 'helena.portaria@safe.senai.local'],
            [
                'name' => 'Helena Portaria',
                'password' => Hash::make('password123'),
                'role' => HubRole::SAFE_PORTARIA,
                'custom_permissions' => null,
                'email_verified_at' => now(),
            ],
        );

        $students = collect([
            ['registration' => '2025AUT0003', 'name' => 'Maria Silva', 'class_name' => 'TURMA AUT25-02'],
            ['registration' => '2025AUT0021', 'name' => 'João Paulo Vieira', 'class_name' => 'TURMA AUT25-02'],
            ['registration' => '2025AUT0015', 'name' => 'Ana Carolina Souza', 'class_name' => 'TURMA AUT25-02'],
        ])->map(fn (array $data) => SafeStudent::query()->updateOrCreate(
            ['registration' => $data['registration']],
            array_merge($data, ['active' => true]),
        ));

        $pendingExit = SafeAuthorization::query()->updateOrCreate(
            ['protocol' => 'SAF'.now()->format('Y').'-00001'],
            [
                'safe_student_id' => $students[0]->id,
                'student_name' => $students[0]->name,
                'class_name' => $students[0]->class_name,
                'type' => AuthorizationType::Saida,
                'reason' => 'Consulta médica',
                'absence_count' => 1,
                'scheduled_at' => now()->addMinutes(30),
                'status' => AuthorizationStatus::AguardandoProfessor,
                'requested_by' => $aqv->id,
            ],
        );

        SafeAuthorizationLog::query()->firstOrCreate(
            [
                'safe_authorization_id' => $pendingExit->id,
                'action' => 'Solicitação criada pela AQV',
            ],
            ['user_id' => $aqv->id],
        );

        SafeAuthorization::query()->updateOrCreate(
            ['protocol' => 'SAF'.now()->format('Y').'-00002'],
            [
                'safe_student_id' => $students[1]->id,
                'student_name' => $students[1]->name,
                'class_name' => $students[1]->class_name,
                'type' => AuthorizationType::Entrada,
                'reason' => 'Retorno de atestado',
                'absence_count' => 0,
                'scheduled_at' => now()->subHour(),
                'status' => AuthorizationStatus::Finalizado,
                'requested_by' => $aqv->id,
                'approved_by_teacher' => $professor->id,
                'teacher_approved_at' => now()->subMinutes(45),
                'finalized_at' => now()->subMinutes(45),
            ],
        );

        $awaitingPortaria = SafeAuthorization::query()->updateOrCreate(
            ['protocol' => 'SAF'.now()->format('Y').'-00003'],
            [
                'safe_student_id' => $students[2]->id,
                'student_name' => $students[2]->name,
                'class_name' => $students[2]->class_name,
                'type' => AuthorizationType::Saida,
                'reason' => 'Compromisso familiar',
                'absence_count' => 2,
                'scheduled_at' => now()->addHour(),
                'status' => AuthorizationStatus::LiberadoPortaria,
                'requested_by' => $aqv->id,
                'approved_by_teacher' => $professor->id,
                'teacher_approved_at' => now()->subMinutes(20),
            ],
        );

        SafeAuthorizationLog::query()->firstOrCreate(
            [
                'safe_authorization_id' => $awaitingPortaria->id,
                'action' => 'Professor aprovou saída',
            ],
            ['user_id' => $professor->id],
        );

        unset($aqv, $professor, $portaria);
    }
}
