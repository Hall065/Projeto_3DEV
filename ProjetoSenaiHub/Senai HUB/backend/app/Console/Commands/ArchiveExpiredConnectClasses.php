<?php

namespace App\Console\Commands;

use App\Services\Connect\ConnectClassArchiveService;
use Illuminate\Console\Command;

class ArchiveExpiredConnectClasses extends Command
{
    protected $signature = 'connect:archive-expired-classes';

    protected $description = 'Arquiva turmas ativas cujo end_date já passou (status finished)';

    public function handle(ConnectClassArchiveService $archive): int
    {
        $pending = $archive->countPendingAutoArchive();

        if ($pending === 0) {
            $this->info('Nenhuma turma pendente de arquivamento automático.');

            return self::SUCCESS;
        }

        $archived = $archive->archiveExpiredClasses();

        $this->info("Arquivamento concluído: {$archived} turma(s) encerrada(s).");

        return self::SUCCESS;
    }
}
