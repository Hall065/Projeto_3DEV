<?php

namespace App\Enums\Safe;

enum AuthorizationStatus: string
{
    case PendenteAqv = 'pendente_aqv';
    case AguardandoProfessor = 'aguardando_professor';
    case LiberadoPortaria = 'liberado_portaria';
    case Finalizado = 'finalizado';
    case Negado = 'negado';
}
