<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Contrato — {{ $nome_aluno }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; margin: 40px; }
        h1 { font-size: 16pt; text-align: center; margin-bottom: 24px; }
        h2 { font-size: 13pt; margin-top: 20px; }
        p { margin: 10px 0; text-align: justify; }
        .meta { margin: 24px 0; }
        .meta table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 6px 8px; vertical-align: top; border: 1px solid #ccc; }
        .meta td:first-child { width: 35%; font-weight: bold; background: #f5f5f5; }
        .signatures { margin-top: 48px; }
        .signatures table { width: 100%; }
        .signatures td { width: 50%; text-align: center; padding-top: 40px; }
        .line { border-top: 1px solid #333; width: 80%; margin: 0 auto 8px; }
        .footer { margin-top: 32px; font-size: 9pt; color: #666; text-align: center; }
    </style>
</head>
<body>
    <h1>CONTRATO DE {{ $tipo_contrato_label }}</h1>

    <p>
        Pelo presente instrumento, de um lado a empresa <strong>{{ $empresa }}</strong>
        @if($email_empresa)
            (e-mail: {{ $email_empresa }})
        @endif
        e, de outro, o(a) aluno(a) <strong>{{ $nome_aluno }}</strong>, matriculado(a) no curso
        <strong>{{ $curso }}</strong>, firmam o presente contrato de {{ $tipo_contrato }}, nas condições abaixo.
    </p>

    <div class="meta">
        <table>
            <tr>
                <td>Aluno(a)</td>
                <td>{{ $nome_aluno }}</td>
            </tr>
            <tr>
                <td>Empresa concedente</td>
                <td>{{ $empresa }}</td>
            </tr>
            <tr>
                <td>Curso</td>
                <td>{{ $curso }}</td>
            </tr>
            <tr>
                <td>Carga horária semanal</td>
                <td>{{ $carga_horaria }}</td>
            </tr>
            <tr>
                <td>Carga horária do curso</td>
                <td>{{ $carga_curso }}</td>
            </tr>
            <tr>
                <td>Duração do curso</td>
                <td>{{ $duracao_curso }}</td>
            </tr>
            <tr>
                <td>Período do contrato</td>
                <td>{{ $periodo_contrato }}</td>
            </tr>
            <tr>
                <td>Valor mensal</td>
                <td>{{ $valor_mensal }}</td>
            </tr>
        </table>
    </div>

    <h2>Cláusula 1 — Do objeto</h2>
    <p>
        O presente contrato tem por objeto a formalização da relação de {{ $tipo_contrato }} entre a empresa
        <strong>{{ $empresa }}</strong> e o(a) aluno(a) <strong>{{ $nome_aluno }}</strong>, vinculado(a) ao curso
        <strong>{{ $curso }}</strong>, com duração prevista de <strong>{{ $duracao_curso }}</strong> e carga horária
        total de <strong>{{ $carga_curso }}</strong>.
    </p>

    <h2>Cláusula 2 — Da jornada</h2>
    <p>
        A jornada de atividades será de <strong>{{ $carga_horaria }}</strong> semanais, respeitando a legislação
        vigente e as normas internas da empresa e da instituição de ensino.
    </p>

    <h2>Cláusula 3 — Da remuneração</h2>
    <p>
        Fica estabelecido o valor mensal de <strong>{{ $valor_mensal }}</strong>, a ser pago conforme as
        disposições legais e acordos entre as partes.
    </p>

    <h2>Cláusula 4 — Do prazo</h2>
    <p>
        O contrato terá início em <strong>{{ $data_inicio }}</strong>
        @if($data_fim)
            e término previsto para <strong>{{ $data_fim }}</strong>,
        @endif
        podendo ser prorrogado ou encerrado conforme regulamento e acordo entre as partes.
    </p>

    <h2>Cláusula 5 — Das disposições gerais</h2>
    <p>
        As partes comprometem-se a cumprir as obrigações previstas na legislação aplicável, no regulamento do curso
        e nas normas da instituição. Este documento foi gerado automaticamente pelo SENAI Connect e deve ser revisado
        e assinado pelas partes antes de sua validade definitiva.
    </p>

    <div class="signatures">
        <table>
            <tr>
                <td>
                    <div class="line"></div>
                    <strong>{{ $empresa }}</strong><br>
                    Empresa concedente
                </td>
                <td>
                    <div class="line"></div>
                    <strong>{{ $nome_aluno }}</strong><br>
                    Aluno(a)
                </td>
            </tr>
        </table>
    </div>

    <p class="footer">Documento gerado em {{ $data_emissao }} — SENAI Connect</p>
</body>
</html>
