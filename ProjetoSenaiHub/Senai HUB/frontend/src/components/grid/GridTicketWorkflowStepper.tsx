import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getTicketWorkflowSteps, workflowStepIndex } from '../../utils/gridTicketWorkflow'
import type { GridTicketStatus } from '../../types/grid'

export function GridTicketWorkflowStepper({ currentStatus }: { currentStatus: GridTicketStatus }) {
  const { t } = useTranslation()
  const steps = getTicketWorkflowSteps()
  const activeIndex = workflowStepIndex(currentStatus)

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
      {steps.map((step, index) => {
        const done = index < activeIndex
        const current = index === activeIndex
        const upcoming = index > activeIndex

        return (
          <li
            key={step.status}
            className={`relative flex min-w-0 flex-1 gap-3 sm:flex-col sm:items-center sm:px-1 sm:text-center ${
              index < steps.length - 1
                ? "pb-6 after:absolute after:left-[15px] after:top-8 after:hidden after:h-[calc(100%-2rem)] after:w-px after:bg-hub-border/60 sm:pb-0 sm:after:left-[calc(50%+20px)] sm:after:top-5 sm:after:block sm:after:h-px sm:after:w-[calc(100%-40px)]"
                : ''
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : current
                    ? 'border-hub-red bg-hub-red text-white'
                    : 'border-hub-border/60 bg-white text-hub-text-muted'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <div className="min-w-0 flex-1 sm:flex-none">
              <p
                className={`text-sm font-semibold ${
                  current ? 'text-hub-red' : done ? 'text-emerald-700' : upcoming ? 'text-hub-text-muted' : 'text-hub-navy'
                }`}
              >
                {t(`grid.labels.ticketStatus.${step.status}`, { defaultValue: step.label })}
              </p>
              <p className="mt-0.5 hidden text-xs leading-snug text-hub-text-muted sm:line-clamp-2">
                {t(`grid.workflow.stepHints.${step.status}`, { defaultValue: step.description })}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
