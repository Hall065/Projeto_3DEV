<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectContractAttachment;
use App\Models\User;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class ConnectContractDocumentService
{
    public function __construct(
        private readonly ConnectContractAttachmentService $attachments,
    ) {}

    /**
     * @return array<string, string>
     */
    public function templateData(ConnectContract $contract): array
    {
        $contract->loadMissing(['student.connectClass.course']);

        $student = $contract->student;
        $class = $student?->connectClass;
        $course = $class?->course;

        $courseName = $course?->name ?? 'Curso não informado';
        $workloadHours = (int) ($course?->workload_hours ?? 0);
        $cargaCurso = $workloadHours > 0 ? "{$workloadHours} horas" : 'Não informada';

        $classStart = $class?->start_date ?? $course?->start_date;
        $classEnd = $class?->end_date ?? $course?->end_date;
        $duracaoCurso = $this->formatPeriod($classStart, $classEnd);

        $contractStart = $contract->start_date;
        $contractEnd = $contract->end_date;
        $periodoContrato = $this->formatPeriod($contractStart, $contractEnd);

        $tipoLabels = [
            'aprendizagem' => 'Aprendizagem',
            'estagio' => 'Estágio',
            'clt' => 'CLT',
            'temporario' => 'Temporário',
        ];

        $tipo = (string) $contract->contract_type;
        $tipoLabel = $tipoLabels[$tipo] ?? ucfirst($tipo);

        $weeklyHours = (int) ($contract->weekly_hours ?? 0);
        $cargaHoraria = $weeklyHours > 0 ? "{$weeklyHours} horas semanais" : 'Não informada';

        $monthlyValue = (float) $contract->monthly_value;
        $valorMensal = $monthlyValue > 0
            ? 'R$ '.number_format($monthlyValue, 2, ',', '.')
            : 'A combinar';

        return [
            'nome_aluno' => $student?->full_name ?? 'Aluno não informado',
            'empresa' => $contract->company_name ?: 'Empresa não informada',
            'email_empresa' => (string) ($contract->company_email ?? ''),
            'curso' => $courseName,
            'carga_horaria' => $cargaHoraria,
            'carga_curso' => $cargaCurso,
            'duracao_curso' => $duracaoCurso,
            'periodo_contrato' => $periodoContrato,
            'valor_mensal' => $valorMensal,
            'data_inicio' => $this->formatDate($contractStart),
            'data_fim' => $contractEnd ? $this->formatDate($contractEnd) : '',
            'tipo_contrato' => strtolower($tipoLabel),
            'tipo_contrato_label' => strtoupper($tipoLabel),
            'data_emissao' => now()->format('d/m/Y'),
        ];
    }

    public function renderHtml(ConnectContract $contract): string
    {
        return View::make('contracts.default', $this->templateData($contract))->render();
    }

    public function renderPdf(ConnectContract $contract): string
    {
        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->renderHtml($contract));
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }

    public function generateAndAttach(ConnectContract $contract, ?User $user = null, bool $replaceExisting = false): ConnectContractAttachment
    {
        if ($replaceExisting) {
            $contract->attachments()
                ->where('is_generated', true)
                ->get()
                ->each(fn (ConnectContractAttachment $attachment) => $this->attachments->delete($attachment));
        }

        $studentName = Str::slug($contract->student?->full_name ?? 'aluno', '_');
        $filename = "contrato_{$studentName}_".now()->format('Ymd').'.pdf';

        return $this->attachments->storeFromContents(
            $contract,
            $this->renderPdf($contract),
            $filename,
            'application/pdf',
            $user,
            true,
        );
    }

    private function formatDate(?Carbon $date): string
    {
        return $date?->format('d/m/Y') ?? '—';
    }

    private function formatPeriod(mixed $start, mixed $end): string
    {
        if (! $start && ! $end) {
            return 'Não informada';
        }

        $startLabel = $start instanceof Carbon ? $start->format('d/m/Y') : ($start ? Carbon::parse($start)->format('d/m/Y') : '—');
        $endLabel = $end instanceof Carbon ? $end->format('d/m/Y') : ($end ? Carbon::parse($end)->format('d/m/Y') : '—');

        if ($startLabel === '—' && $endLabel === '—') {
            return 'Não informada';
        }

        return "{$startLabel} a {$endLabel}";
    }
}
