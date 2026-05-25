import { ConnectCard, ConnectPageHeader } from '../../components/connect/ConnectShared'

export function ReportPage() {
  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title="Relatorio"
        subtitle="Modulo de relatorios em desenvolvimento. Em breve voce podera exportar dados academicos."
      />
      <ConnectCard className="p-8 text-center text-hub-text-muted">
        <p>Relatorios personalizados estarao disponiveis na proxima versao.</p>
      </ConnectCard>
    </div>
  )
}
