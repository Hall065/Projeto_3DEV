import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { OutlineButton, PrimaryButton } from '../components/connect/ConnectShared'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="glass-panel-solid max-w-md rounded-2xl p-8">
        <MapPinOff className="mx-auto mb-4 h-12 w-12 text-hub-text-muted" />
        <h1 className="text-xl font-bold text-hub-navy">Pagina nao encontrada</h1>
        <p className="mt-2 text-sm text-hub-text-muted">
          O endereco digitado nao existe ou foi movido. Volte ao Hub para continuar navegando.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/hub">
            <PrimaryButton>Abrir Hub</PrimaryButton>
          </Link>
          <Link to="/">
            <OutlineButton>Pagina inicial</OutlineButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
