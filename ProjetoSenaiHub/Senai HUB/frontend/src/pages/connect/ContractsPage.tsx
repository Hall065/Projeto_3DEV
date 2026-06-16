import { Download, Eye, FileText, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConnectContractAttachmentsPanel } from '../../components/connect/ConnectContractAttachmentsPanel'
import { ConnectDrawer } from '../../components/connect/ConnectDrawer'
import { ConnectEntityViewDrawer } from '../../components/connect/ConnectEntityViewDrawer'
import { ConnectRowActionsMenu } from '../../components/connect/ConnectRowActionsMenu'
import {
  ConnectCard,
  ConnectPageHeader,
  ConnectLoadingSpinner,
  ConnectPagination,
  ConnectTableScroll,
  FormField,
  formatDate,
  inputClass,
  OutlineButton,
  PrimaryButton,
  selectClass,
  StatusBadge,
} from '../../components/connect/ConnectShared'
import { connectService } from '../../services/connectService'
import type { ConnectContract, ConnectContractAttachment, ConnectStudent, PaginatedMeta } from '../../types/connect'
import { downloadCsv } from '../../utils/csvExport'
import { useConfirmAction } from '../../hooks/useConfirmAction'
import { useCrudToast } from '../../hooks/useCrudToast'
const emptyContractForm = {
  connect_student_id: '',
  contract_type: 'aprendizagem',
  weekly_hours: '8',
  start_date: '',
  monthly_value: '',
  company_name: '',
  company_email: '',
  status: 'active',
  generate_document: true,
}

export function ContractsPage() {
  const { t } = useTranslation()
  const crudToast = useCrudToast()
  const { confirmDelete } = useConfirmAction()
  const [contracts, setContracts] = useState<ConnectContract[]>([])
  const [students, setStudents] = useState<ConnectStudent[]>([])
  const [meta, setMeta] = useState<PaginatedMeta | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyContractForm)
  const [viewId, setViewId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterContractType, setFilterContractType] = useState('')
  const [attachments, setAttachments] = useState<ConnectContractAttachment[]>([])

  const selectedStudent = useMemo(
    () => students.find((s) => String(s.id) === form.connect_student_id),
    [students, form.connect_student_id],
  )

  const load = () => {
    setLoading(true)
    const params: Record<string, string | number> = { page, per_page: 10 }
    if (filterStatus) params.status = filterStatus
    if (filterContractType) params.contract_type = filterContractType
    connectService
      .getContracts(params)
      .then((res) => {
        setContracts(res.data)
        setMeta(res.meta)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    connectService.getStudents({ per_page: 50 }).then((res) => setStudents(res.data))
  }, [page, filterStatus, filterContractType])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyContractForm)
    setAttachments([])
    setDrawerOpen(true)
  }

  const openEdit = (contract: ConnectContract) => {
    setEditingId(contract.id)
    setForm({
      connect_student_id: String(contract.connect_student_id ?? contract.student?.id ?? ''),
      contract_type: contract.contract_type ?? 'aprendizagem',
      weekly_hours: String(contract.weekly_hours ?? 8),
      start_date: contract.start_date?.slice(0, 10) ?? '',
      monthly_value: String(contract.monthly_value ?? ''),
      company_name: contract.company_name ?? '',
      company_email: contract.company_email ?? '',
      status: contract.status ?? 'active',
      generate_document: false,
    })
    setAttachments(contract.attachments ?? [])
    setDrawerOpen(true)
  }

  const buildPayload = () => ({
    connect_student_id: Number(form.connect_student_id),
    contract_type: form.contract_type,
    weekly_hours: Number(form.weekly_hours) || undefined,
    start_date: form.start_date,
    monthly_value: Number(form.monthly_value) || 0,
    company_name: form.company_name,
    company_email: form.company_email.trim() || undefined,
    status: form.status,
    ...(editingId ? {} : { generate_document: form.generate_document }),
  })

  const handleSave = async (keepOpen = false) => {
    const payload = buildPayload()
    try {
      const wasEdit = !!editingId
      if (editingId) {
        await connectService.updateContract(editingId, payload)
      } else {
        const created = await connectService.createContract(payload)
        if (keepOpen) {
          setEditingId(created.id)
          setAttachments(created.attachments ?? [])
        }
      }
      if (keepOpen) {
        setEditingId(null)
        setForm(emptyContractForm)
        setAttachments([])
      } else {
        setDrawerOpen(false)
        setEditingId(null)
      }
      crudToast.notifySaved(wasEdit)
      load()
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.classes.alert.saveError'))
    }
  }

  const handleExport = () => {
    downloadCsv(
      'contratos',
      [
        t('connect.contracts.table.workload'),
        t('connect.table.course'),
        t('connect.contracts.table.studentName'),
        t('connect.contracts.table.company'),
        t('connect.contracts.table.start'),
        t('connect.contracts.table.monthlyValue'),
        t('connect.table.status'),
      ],
      contracts.map((contract) => [
        contract.weekly_hours != null ? `${contract.weekly_hours}h` : '-',
        contract.student?.class?.course?.name ?? '-',
        contract.student?.full_name ?? '-',
        contract.company_name ?? '-',
        formatDate(contract.start_date),
        contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        contract.status,
      ]),
    )
  }

  const handleDelete = async (contract: ConnectContract) => {
    const label = contract.student?.full_name ?? t('connect.contracts.drawer.new')
    if (!(await confirmDelete(`o contrato de ${label}`))) return
    try {
      await connectService.deleteContract(contract.id)
      crudToast.notifyDeleted()
      load()
    } catch (error: unknown) {
      crudToast.notifyError(error, t('connect.classes.alert.deleteError'))
    }
  }

  return (
    <div className="w-full min-w-0">
      <ConnectPageHeader
        title={t('connect.contracts.title')}
        subtitle={t('connect.contracts.subtitle')}
        actions={
          <>
            <OutlineButton onClick={() => setShowFilters((v) => !v)}>
              <Filter className="h-4 w-4" /> {t('connect.common.filters')}
            </OutlineButton>
            <OutlineButton onClick={handleExport}>
              <Download className="h-4 w-4" /> {t('connect.common.export')}
            </OutlineButton>
            <PrimaryButton onClick={openCreate}><Plus className="h-4 w-4" /> {t('connect.common.new')}</PrimaryButton>
          </>
        }
      />

      {showFilters && (
        <ConnectCard className="mb-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('connect.table.status')}>
              <select
                className={selectClass}
                value={filterStatus}
                onChange={(e) => {
                  setPage(1)
                  setFilterStatus(e.target.value)
                }}
              >
                <option value="">{t('connect.students.filters.allStatuses')}</option>
                <option value="active">{t('connect.status.active')}</option>
                <option value="inactive">{t('connect.status.inactive')}</option>
                <option value="finished">{t('connect.contracts.filters.terminated')}</option>
              </select>
            </FormField>
            <FormField label={t('connect.contracts.filters.contractType')}>
              <select
                className={selectClass}
                value={filterContractType}
                onChange={(e) => {
                  setPage(1)
                  setFilterContractType(e.target.value)
                }}
              >
                <option value="">{t('connect.common.all')}</option>
                <option value="aprendizagem">{t('connect.contracts.filters.apprenticeship')}</option>
                <option value="estagio">{t('connect.contracts.filters.internship')}</option>
                <option value="clt">{t('connect.contracts.filters.clt')}</option>
                <option value="temporario">{t('connect.contracts.filters.temporary')}</option>
              </select>
            </FormField>
          </div>
        </ConnectCard>
      )}

      <ConnectCard>
        {loading ? (
          <ConnectLoadingSpinner label={t('connect.contracts.loading')} className="min-h-[280px]" />
        ) : (
        <>
        <ConnectTableScroll>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="glass-thead text-hub-text-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.workload')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.course')}</th>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.studentName')}</th>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.company')}</th>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.start')}</th>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.monthlyValue')}</th>
                <th className="px-4 py-3 text-left">{t('connect.table.status')}</th>
                <th className="px-4 py-3 text-left">{t('connect.contracts.table.copy')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-t border-hub-border/40">
                  <td className="px-4 py-3">
                    {contract.weekly_hours != null ? `${contract.weekly_hours}h` : '-'}
                  </td>
                  <td className="px-4 py-3">{contract.student?.class?.course?.name ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">{contract.student?.full_name ?? '-'}</td>
                  <td className="px-4 py-3">{contract.company_name ?? '-'}</td>
                  <td className="px-4 py-3">{formatDate(contract.start_date)}</td>
                  <td className="px-4 py-3">R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                  <td className="px-4 py-3">
                    {(contract.attachments?.length ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-hub-navy">
                        <FileText className="h-4 w-4" />
                        {contract.attachments?.length}
                      </span>
                    ) : (
                      <span className="text-hub-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConnectRowActionsMenu
                      ariaLabel={t('connect.common.actionsOf', { name: contract.student?.full_name ?? t('connect.personKind.student') })}
                      actions={[
                        {
                          key: 'view',
                          label: t('connect.common.view'),
                          icon: Eye,
                          onClick: () => setViewId(contract.id),
                        },
                        { key: 'edit', label: t('connect.common.edit'), icon: Pencil, onClick: () => openEdit(contract) },
                        {
                          key: 'delete',
                          label: t('connect.common.delete'),
                          icon: Trash2,
                          variant: 'danger',
                          onClick: () => void handleDelete(contract),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ConnectTableScroll>
        <div className="flex flex-col gap-3 border-t border-hub-border/60 px-4 py-3 text-sm text-hub-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{t('connect.contracts.totalRecords')} {meta?.total ?? 0}</span>
          <ConnectPagination meta={meta} onPageChange={setPage} />
        </div>
        </>
        )}
      </ConnectCard>

      <ConnectDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingId(null)
        }}
        title={editingId ? t('connect.contracts.drawer.edit') : t('connect.contracts.drawer.new')}
        subtitle={editingId ? t('connect.classes.drawer.editSubtitle') : t('connect.classes.drawer.newSubtitle')}
        footer={
          <div className="flex justify-end gap-2">
            <OutlineButton onClick={() => setDrawerOpen(false)}>{t('common.cancel')}</OutlineButton>
            <OutlineButton onClick={() => void handleSave(true)}>{t('connect.common.saveAndNew')}</OutlineButton>
            <PrimaryButton onClick={() => void handleSave()}>{t('common.save')}</PrimaryButton>
          </div>
        }
      >
        <div className="space-y-4">
          <h3 className="font-semibold text-hub-navy">{t('connect.contracts.drawer.section')}</h3>
          <FormField label={t('connect.students.form.fullName')} required>
            <select className={selectClass} value={form.connect_student_id} onChange={(e) => setForm({ ...form, connect_student_id: e.target.value })}>
              <option value="">{t('connect.contracts.form.student')}</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </FormField>
          <FormField label={t('connect.contracts.form.company')} required>
            <input className={inputClass} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </FormField>
          <FormField label={t('connect.contracts.filters.contractType')} required>
            <select className={selectClass} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
              <option value="aprendizagem">{t('connect.contracts.filters.apprenticeship')}</option>
              <option value="estagio">{t('connect.contracts.filters.internship')}</option>
              <option value="clt">{t('connect.contracts.filters.clt')}</option>
              <option value="temporario">{t('connect.contracts.filters.temporary')}</option>
            </select>
          </FormField>
          <FormField label={t('connect.contracts.form.workload')}>
            <select className={selectClass} value={form.weekly_hours} onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })}>
              <option value="4">4h</option>
              <option value="6">6h</option>
              <option value="8">8h</option>
            </select>
          </FormField>
          <FormField label={t('connect.contracts.form.startDate')} required hint={t('connect.students.form.calendarHint')}>
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </FormField>
          <FormField label={t('connect.contracts.form.monthlyValue')}>
            <input type="number" className={inputClass} value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: e.target.value })} step="0.01" min={0} />
          </FormField>
          <FormField label={t('connect.students.form.personalEmail')}>
            <input
              type="email"
              className={`${inputClass} bg-hub-bg/60`}
              readOnly
              value={selectedStudent?.email ?? ''}
              placeholder={form.connect_student_id ? '-' : t('connect.contracts.form.student')}
            />
          </FormField>
          <FormField label={t('connect.teachers.form.institutionalEmail')}>
            <input
              type="email"
              className={`${inputClass} bg-hub-bg/60`}
              readOnly
              value={selectedStudent?.hub_person?.email ?? selectedStudent?.email ?? ''}
              placeholder={form.connect_student_id ? '-' : t('connect.contracts.form.student')}
            />
          </FormField>
          <FormField label={t('connect.table.email')}>
            <input
              type="email"
              className={inputClass}
              value={form.company_email}
              onChange={(e) => setForm({ ...form, company_email: e.target.value })}
            />
          </FormField>
          <FormField label={t('connect.table.status')}>
            <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t('connect.status.active')}</option>
              <option value="inactive">{t('connect.status.inactive')}</option>
              <option value="finished">{t('connect.contracts.filters.terminated')}</option>
            </select>
          </FormField>
          {!editingId && (
            <label className="flex items-start gap-2 text-sm text-hub-text-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.generate_document}
                onChange={(e) => setForm({ ...form, generate_document: e.target.checked })}
              />
              <span>{t('connect.contracts.attachments.generateOnSave')}</span>
            </label>
          )}
          <ConnectContractAttachmentsPanel
            contractId={editingId}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>
      </ConnectDrawer>

      <ConnectEntityViewDrawer
        kind="contract"
        entityId={viewId}
        open={viewId !== null}
        onClose={() => setViewId(null)}
      />
    </div>
  )
}
