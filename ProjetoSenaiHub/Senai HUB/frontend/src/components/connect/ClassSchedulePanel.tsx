import { CalendarPlus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { connectService } from '../../services/connectService'
import { parseApiError } from '../../utils/parseApiError'
import type { ConnectSchedulePlan, ConnectWeeklyPattern } from '../../types/connect'
import { FormField, inputClass, OutlineButton, PrimaryButton, selectClass } from './ConnectShared'

const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]

type Props = {
  classId: number
  canManage: boolean
  onUpdated?: () => void
}

export function ClassSchedulePanel({ classId, canManage, onUpdated }: Props) {
  const { t } = useTranslation()
  const [patterns, setPatterns] = useState<ConnectWeeklyPattern[]>([])
  const [plan, setPlan] = useState<ConnectSchedulePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [replaceFuture, setReplaceFuture] = useState(false)

  const defaultPattern = (): ConnectWeeklyPattern => ({
    day_of_week: 1,
    start_time: '19:00',
    end_time: '22:00',
    lessons_count: 4,
    subject: t('connect.classes.defaultSubject'),
  })

  const load = () => {
    setLoading(true)
    connectService
      .getWeeklyPatterns(classId)
      .then(({ patterns: p, plan: pl }) => {
        setPatterns(p)
        setPlan(pl)
      })
      .catch(() => {
        setPatterns([])
        setPlan(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [classId])

  const handleSavePatterns = async (generate = false) => {
    setBusy(true)
    try {
      const result = await connectService.syncWeeklyPatterns(classId, {
        patterns,
        generate,
        replace_future: replaceFuture,
      })
      setPatterns(result.patterns)
      setPlan(result.plan)
      if (result.generation) {
        const msg = t('connect.schedule.generationResult', {
          created: result.generation.created,
          skipped: result.generation.skipped,
        })
        window.alert(msg)
      }
      onUpdated?.()
    } catch (err) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  const handleGenerate = async () => {
    setBusy(true)
    try {
      const { plan: pl, generation } = await connectService.generateClassSchedule(classId, replaceFuture)
      setPlan(pl)
      window.alert(
        t('connect.schedule.generationResult', {
          created: generation.created,
          skipped: generation.skipped,
        }),
      )
      onUpdated?.()
    } catch (err) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  const handleProvision = async () => {
    setBusy(true)
    try {
      const result = await connectService.provisionClassAttendance(classId)
      window.alert(t('connect.schedule.provisionResult', { count: result.created }))
      onUpdated?.()
    } catch (err) {
      window.alert(parseApiError(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-hub-text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-4">
      {plan && (
        <div className="rounded-lg border border-hub-border/50 bg-hub-surface/60 p-3 text-sm text-hub-text-muted">
          <p>
            {t('connect.classes.scheduleSummary', {
              total: `${plan.scheduled_lessons}/${plan.workload_hours || '—'}`,
              weekly: plan.weekly_lessons,
              remaining: plan.remaining_lessons ?? '—',
            })}
          </p>
          {plan.semester && (
            <p className="mt-1">
              {t('connect.classes.table.semester')}: <strong>{plan.semester}</strong>
            </p>
          )}
          {(plan.class_start_date || plan.class_end_date) && (
            <p className="mt-1">
              {t('connect.schedule.period')}: {plan.class_start_date ?? '—'} → {plan.class_end_date ?? '—'}
            </p>
          )}
        </div>
      )}

      {canManage && (
        <>
          <FormField label={t('connect.classes.weekly.title')}>
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-hub-border/60 p-2 sm:grid-cols-5">
                  <select
                    className={selectClass}
                    value={pattern.day_of_week}
                    onChange={(e) => {
                      const next = [...patterns]
                      next[index] = { ...pattern, day_of_week: Number(e.target.value) }
                      setPatterns(next)
                    }}
                  >
                    {DAY_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {t(`connect.days.${value}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className={inputClass}
                    value={pattern.start_time}
                    onChange={(e) => {
                      const next = [...patterns]
                      next[index] = { ...pattern, start_time: e.target.value }
                      setPatterns(next)
                    }}
                  />
                  <input
                    type="time"
                    className={inputClass}
                    value={pattern.end_time}
                    onChange={(e) => {
                      const next = [...patterns]
                      next[index] = { ...pattern, end_time: e.target.value }
                      setPatterns(next)
                    }}
                  />
                  <select
                    className={selectClass}
                    value={pattern.lessons_count}
                    onChange={(e) => {
                      const next = [...patterns]
                      next[index] = { ...pattern, lessons_count: Number(e.target.value) }
                      setPatterns(next)
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {t('connect.classes.weekly.lessons', { count: n })}
                      </option>
                    ))}
                  </select>
                  <OutlineButton type="button" onClick={() => setPatterns(patterns.filter((_, i) => i !== index))}>
                    {t('connect.classes.weekly.remove')}
                  </OutlineButton>
                </div>
              ))}
              <OutlineButton type="button" onClick={() => setPatterns([...patterns, defaultPattern()])}>
                {t('connect.classes.weekly.addSlot')}
              </OutlineButton>
            </div>
          </FormField>

          <label className="flex items-center gap-2 text-xs text-hub-text-muted">
            <input type="checkbox" checked={replaceFuture} onChange={(e) => setReplaceFuture(e.target.checked)} />
            {t('connect.schedule.replaceFuture')}
          </label>

          <div className="flex flex-wrap gap-2">
            <PrimaryButton type="button" disabled={busy} onClick={() => void handleSavePatterns(false)}>
              {t('connect.schedule.savePatterns')}
            </PrimaryButton>
            <OutlineButton type="button" disabled={busy} onClick={() => void handleSavePatterns(true)}>
              <CalendarPlus className="h-4 w-4" />
              {t('connect.schedule.saveAndGenerate')}
            </OutlineButton>
            <OutlineButton type="button" disabled={busy} onClick={() => void handleGenerate()}>
              <RefreshCw className="h-4 w-4" />
              {t('connect.schedule.regenerate')}
            </OutlineButton>
            <OutlineButton type="button" disabled={busy} onClick={() => void handleProvision()}>
              {t('connect.schedule.provisionAttendance')}
            </OutlineButton>
          </div>
        </>
      )}
    </div>
  )
}
