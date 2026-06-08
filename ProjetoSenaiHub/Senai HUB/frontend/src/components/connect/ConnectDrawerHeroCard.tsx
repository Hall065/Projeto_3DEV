import { ArrowLeft } from 'lucide-react'

interface ConnectDrawerHeroCardProps {
  onBack: () => void
  children: React.ReactNode
}

export function ConnectDrawerHeroCard({ onBack, children }: ConnectDrawerHeroCardProps) {
  return (
    <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-hub-border/50 bg-hub-bg/40 p-6 pt-12 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={onBack}
        className="glass-input absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-hub-navy shadow-sm hover:bg-hub-bg"
        aria-label="Voltar"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      {children}
    </div>
  )
}
