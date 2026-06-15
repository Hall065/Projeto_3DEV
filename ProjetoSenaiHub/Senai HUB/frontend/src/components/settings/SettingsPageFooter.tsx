import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navigateBack } from '../../utils/navigation'
import { Button } from '../ui/Button'

interface SettingsPageFooterProps {
  onSave?: () => void
  onBack?: () => void
  saving?: boolean
  saveDisabled?: boolean
  saveLabel?: string
  saveVariant?: 'primary' | 'danger'
}

export function SettingsPageFooter({
  onSave,
  onBack,
  saving = false,
  saveDisabled = false,
  saveLabel,
  saveVariant = 'primary',
}: SettingsPageFooterProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const resolvedSaveLabel = saveLabel ?? t('common.save')

  return (
    <footer className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-hub-border/40 pt-6">
      <Button
        type="button"
        variant="secondary"
        onClick={onBack ?? (() => navigateBack(navigate))}
      >
        {t('common.back')}
      </Button>
      <Button
        type="button"
        variant={saveVariant === 'danger' ? 'danger' : 'primary'}
        className={saveVariant === 'danger' ? '!bg-hub-red hover:!bg-[#c40010]' : ''}
        onClick={onSave}
        isLoading={saving}
        disabled={saveDisabled || !onSave}
      >
        {resolvedSaveLabel}
      </Button>
    </footer>
  )
}
