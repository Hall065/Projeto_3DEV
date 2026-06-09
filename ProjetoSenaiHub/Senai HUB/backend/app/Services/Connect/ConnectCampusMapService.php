<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectStudentLocation;
use App\Models\User;
use App\Support\UserAccessScope;

class ConnectCampusMapService
{
    private const BLOCK_IDS = ['A', 'B', 'C', 'D'];

    private const MOCK_ROOMS = ['101', '102', '201', '203', 'Lab. 1', 'Lab. 2', 'Oficina', 'Sala 15'];

    /**
     * @return list<array{id: string, name: string, role: string, block_id: string, room: string, detail: string, position?: array{x: float, y: float, z: float}}>
     */
    public function peopleForUser(User $user, bool $includeDemoExtras = false): array
    {
        $people = [];
        $seen = [];

        $scopedStudentIds = UserAccessScope::connectStudentQuery($user)->select('id');

        $locations = ConnectStudentLocation::query()
            ->whereIn('connect_student_id', $scopedStudentIds)
            ->whereIn('status', ['inside', 'online'])
            ->with(['student.connectClass'])
            ->orderByDesc('last_seen_at')
            ->limit(200)
            ->get();

        foreach ($locations as $location) {
            $student = $location->student;
            $name = trim((string) ($student?->full_name ?? ''));
            if ($name === '') {
                continue;
            }

            $seed = "student-{$location->connect_student_id}";
            if (isset($seen[$seed])) {
                continue;
            }
            $seen[$seed] = true;

            $blockId = $this->assignBlockFromSeed($seed);
            $room = $this->pickRoom($seed);

            $people[] = $this->personPayload(
                id: $seed,
                name: $name,
                role: 'aluno',
                blockId: $blockId,
                room: $room,
                detail: $student?->connectClass?->name ?? 'Turma em aula',
            );
        }

        $teacherQuery = UserAccessScope::connectTeacherQuery($user);
        $teachers = $teacherQuery
            ->where('status', 'active')
            ->orderBy('full_name')
            ->limit(100)
            ->get();

        foreach ($teachers as $teacher) {
            $seed = "teacher-{$teacher->id}";
            if (isset($seen[$seed])) {
                continue;
            }
            $seen[$seed] = true;

            $blockId = $this->assignBlockFromSeed($seed);
            $room = $this->pickRoom($seed);

            $people[] = $this->personPayload(
                id: $seed,
                name: $teacher->full_name,
                role: 'professor',
                blockId: $blockId,
                room: $room,
                detail: $teacher->specialty ?? 'Docente',
            );
        }

        if ($includeDemoExtras) {
            $people = array_merge($people, $this->demoStaff());

            if (! collect($people)->contains(fn (array $p) => $p['role'] === 'aluno')) {
                $people = array_merge($people, $this->demoStudents());
            }
        }

        return $people;
    }

    /**
     * @return list<array{id: string, name: string, role: string, block_id: string, room: string, detail: string}>
     */
    private function demoStaff(): array
    {
        return [
            $this->personPayload('staff-0-Carla Mendes', 'Carla Mendes', 'funcionario', 'B', 'Recepcao', 'Secretaria'),
            $this->personPayload('staff-1-Roberto Lima', 'Roberto Lima', 'funcionario', 'A', 'Patrimonio', 'Manutencao'),
            $this->personPayload('staff-2-Fernanda Souza', 'Fernanda Souza', 'funcionario', 'C', 'Lab. Informatica', 'TI'),
            $this->personPayload('staff-3-Paulo Henrique', 'Paulo Henrique', 'funcionario', 'D', 'Coordenacao', 'Administrativo'),
            $this->personPayload('staff-4-Juliana Costa', 'Juliana Costa', 'funcionario', 'B', 'Biblioteca', 'Apoio academico'),
        ];
    }

    /**
     * @return list<array{id: string, name: string, role: string, block_id: string, room: string, detail: string, position: array{x: float, y: float, z: float}}>
     */
    private function demoStudents(): array
    {
        return [
            $this->personPayload('demo-aluno-1', 'Joao Silva', 'aluno', 'A', '101', 'Turma DEV-2024'),
            $this->personPayload('demo-aluno-2', 'Maria Oliveira', 'aluno', 'C', 'Lab. 2', 'Turma REDES-2024'),
            $this->personPayload('demo-aluno-3', 'Pedro Santos', 'aluno', 'B', '203', 'Turma AUTO-2024'),
        ];
    }

    /**
     * @return array{id: string, name: string, role: string, block_id: string, room: string, detail: string, position: array{x: float, y: float, z: float}}
     */
    private function personPayload(
        string $id,
        string $name,
        string $role,
        string $blockId,
        string $room,
        string $detail,
    ): array {
        return [
            'id' => $id,
            'name' => $name,
            'role' => $role,
            'block_id' => $blockId,
            'room' => $room,
            'detail' => $detail,
            'position' => $this->resolveRoomPosition($blockId, $room),
        ];
    }

    /**
     * @return array{x: float, y: float, z: float}
     */
    private function resolveRoomPosition(string $blockId, string $room): array
    {
        foreach (config('hub.campus_rooms', []) as $entry) {
            if (($entry['block_id'] ?? '') === $blockId && ($entry['room'] ?? '') === $room) {
                $position = $entry['position'] ?? null;
                if (is_array($position)) {
                    return [
                        'x' => (float) ($position['x'] ?? 0),
                        'y' => (float) ($position['y'] ?? 2),
                        'z' => (float) ($position['z'] ?? 0),
                    ];
                }
            }
        }

        return $this->derivePositionFromBlock($blockId, $room);
    }

    /**
     * @return array{x: float, y: float, z: float}
     */
    private function derivePositionFromBlock(string $blockId, string $room): array
    {
        $base = ['x' => 0.0, 'y' => 2.0, 'z' => 0.0];

        foreach (config('hub.campus_blocks', []) as $block) {
            if (($block['id'] ?? '') === $blockId && is_array($block['position'] ?? null)) {
                $base = [
                    'x' => (float) ($block['position']['x'] ?? 0),
                    'y' => (float) ($block['position']['y'] ?? 2),
                    'z' => (float) ($block['position']['z'] ?? 0),
                ];
                break;
            }
        }

        $hash = $this->hashSeed($blockId.$room);

        return [
            'x' => $base['x'] + (($hash % 17) - 8) * 0.85,
            'y' => $base['y'] + (($hash >> 3) % 4) * 1.2,
            'z' => $base['z'] + ((($hash >> 5) % 17) - 8) * 0.85,
        ];
    }

    private function assignBlockFromSeed(string $seed): string
    {
        $hash = $this->hashSeed($seed);

        return self::BLOCK_IDS[$hash % count(self::BLOCK_IDS)];
    }

    private function pickRoom(string $seed): string
    {
        $hash = $this->hashSeed($seed);

        return self::MOCK_ROOMS[$hash % count(self::MOCK_ROOMS)];
    }

    private function hashSeed(string $value): int
    {
        $hash = 0;
        $length = strlen($value);

        for ($i = 0; $i < $length; $i++) {
            $hash = (($hash << 5) - $hash + ord($value[$i])) & 0xFFFFFFFF;
            if ($hash > 0x7FFFFFFF) {
                $hash -= 0x100000000;
            }
        }

        return abs($hash);
    }
}
