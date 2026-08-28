import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { travelRequestsApi, passportPhotoCacheKey } from '@/api/travelRequests'
import { auditLogApi } from '@/api/auditLog'
import type { Currency, TravelRequestNote, TravelRequestStatus } from '@/types/domain'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/admin/components/PageHeader'
import { DealValueModal } from '@/admin/components/DealValueModal'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Textarea, Select, FieldLabel, Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { adminErrorMessage } from '@/lib/apiError'
import { relativeTimeRu } from '@/admin/lib/relativeTime'
import { STATUS_ORDER, STATUS_LABEL, STATUS_TONE, isFollowUpOverdue } from '@/admin/lib/requestStatus'

/** Passport photos are never a public URL — fetched as an authenticated blob and rendered via a
 * local object URL, revoked on unmount to avoid leaking the decoded image in memory. */
function PassportPhotoThumb({ requestId, fileName }: { requestId: string; fileName: string }) {
  const photo = useQuery({
    queryKey: ['admin', 'travel-request-photo', passportPhotoCacheKey(requestId, fileName)],
    queryFn: () => travelRequestsApi.adminGetPassportPhotoBlob(requestId, fileName),
  })
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo.data) return
    const url = URL.createObjectURL(photo.data)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo.data])

  if (photo.isPending) return <Skeleton className="h-32 w-32 rounded-lg" />
  if (photo.isError || !objectUrl) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-danger/30 bg-danger/5 text-center text-xs text-danger">
        Не удалось загрузить фото
      </div>
    )
  }

  return (
    <a href={objectUrl} target="_blank" rel="noreferrer" className="block h-32 w-32 overflow-hidden rounded-lg border border-text/15">
      <img src={objectUrl} alt="Фото загранпаспорта" className="h-full w-full object-cover" />
    </a>
  )
}

/** "История общения" — chronological notes feed (newest first) + a composer, with an optimistic
 * insert so the new note appears immediately rather than waiting on a refetch. */
function NotesSection({ requestId }: { requestId: string }) {
  const { admin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const notesKey = ['admin', 'travel-request-notes', requestId]

  const notes = useQuery({ queryKey: notesKey, queryFn: () => travelRequestsApi.adminListNotes(requestId) })

  const addNote = useMutation({
    mutationFn: (noteText: string) => travelRequestsApi.adminAddNote(requestId, noteText),
    onMutate: async (noteText) => {
      await queryClient.cancelQueries({ queryKey: notesKey })
      const prev = queryClient.getQueryData<TravelRequestNote[]>(notesKey)
      const optimisticNote: TravelRequestNote = {
        id: `optimistic-${Date.now()}`,
        travelRequestId: requestId,
        text: noteText,
        createdAtUtc: new Date().toISOString(),
        authorAdminUserId: admin?.id ?? '',
        authorDisplayName: admin?.displayName ?? 'Вы',
      }
      queryClient.setQueryData<TravelRequestNote[]>(notesKey, (old) => [optimisticNote, ...(old ?? [])])
      return { prev }
    },
    onError: (error, _text, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notesKey, ctx.prev)
      showToast(adminErrorMessage('Не удалось добавить заметку', error), 'error')
    },
    onSuccess: () => setText(''),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notesKey }),
  })

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || addNote.isPending) return
    addNote.mutate(trimmed)
  }

  return (
    <Card className="p-6">
      <p className="mb-4 text-sm font-medium text-slate">История общения</p>

      {notes.isPending && <Skeleton className="h-20 w-full" />}
      {notes.isError && <ErrorState onRetry={() => notes.refetch()} />}
      {notes.isSuccess && notes.data.length === 0 && <EmptyState title="Заметок пока нет" />}
      {notes.isSuccess && notes.data.length > 0 && (
        <ul className="mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {notes.data.map((note) => (
            <li key={note.id} className="rounded-lg border border-text/8 bg-paper px-4 py-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate">
                <span className="font-medium text-text">{note.authorDisplayName}</span>
                <span>{relativeTimeRu(note.createdAtUtc)}</span>
              </div>
              <p className="whitespace-pre-line">{note.text}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Добавить заметку о звонке или переписке…"
          className="min-h-20"
          disabled={addNote.isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
        />
        <Button onClick={submit} disabled={!text.trim() || addNote.isPending} className="self-end">
          <Send size={14} /> {addNote.isPending ? 'Добавление…' : 'Добавить заметку'}
        </Button>
      </div>
    </Card>
  )
}

export function TravelRequestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { admin } = useAuth()
  const isSuperAdmin = admin?.role === 'SuperAdmin'

  const requestKey = ['admin', 'travel-request', id]
  const request = useQuery({ queryKey: requestKey, queryFn: () => travelRequestsApi.adminGet(id) })
  const audit = useQuery({
    queryKey: ['admin', 'audit-log', 'TravelRequest', id],
    queryFn: () => auditLogApi.list({ entityType: 'TravelRequest', entityId: id, page: 1, pageSize: 20 }),
    enabled: isSuperAdmin,
  })
  const assignable = useQuery({
    queryKey: ['admin', 'assignable-admins'],
    queryFn: () => travelRequestsApi.adminGetAssignableAdmins(),
  })

  const [dealValueModalOpen, setDealValueModalOpen] = useState(false)
  const [followUpDraft, setFollowUpDraft] = useState<string | null>(null)

  const invalidateRequest = () => {
    void queryClient.invalidateQueries({ queryKey: requestKey })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'travel-requests'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'crm-board'] })
  }

  const setStatus = useMutation({
    mutationFn: (status: TravelRequestStatus) => travelRequestsApi.adminSetStatus(id, status),
    onSuccess: () => {
      showToast('Статус обновлён')
      invalidateRequest()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось обновить статус', error), 'error'),
  })

  const setDealValue = useMutation({
    mutationFn: ({ value, currency }: { value: number; currency: Currency }) => travelRequestsApi.adminUpdateDealValue(id, value, currency),
    onError: (error) => showToast(adminErrorMessage('Не удалось сохранить сумму сделки', error), 'error'),
  })

  const setFollowUp = useMutation({
    mutationFn: (date: string | null) => travelRequestsApi.adminUpdateFollowUp(id, date),
    onSuccess: () => {
      showToast('Напоминание обновлено')
      invalidateRequest()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось обновить напоминание', error), 'error'),
  })

  const assign = useMutation({
    mutationFn: (adminUserId: string | null) => travelRequestsApi.adminAssign(id, adminUserId),
    onSuccess: () => {
      showToast('Ответственный обновлён')
      invalidateRequest()
    },
    onError: (error) => showToast(adminErrorMessage('Не удалось назначить ответственного', error), 'error'),
  })

  /** The Won-requires-deal-value gate — shared logic for both the status buttons here and (via
   * the same handler shape) the Kanban board. A request that already has a deal value can move
   * to Won directly; one that doesn't gets the modal first, and the actual status change only
   * fires once a value is confirmed there. */
  function requestStatusChange(status: TravelRequestStatus) {
    if (status === 'Won' && request.data?.dealValue == null) {
      setDealValueModalOpen(true)
      return
    }
    setStatus.mutate(status)
  }

  if (request.isPending) return <Skeleton className="h-64 w-full" />
  if (request.isError) return <ErrorState onRetry={() => request.refetch()} />

  const r = request.data
  const fullName = [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ')
  const isOverdue = isFollowUpOverdue(r)

  return (
    <div>
      <button onClick={() => navigate('/admin/travel-requests')} className="mb-4 flex items-center gap-1 text-sm text-slate hover:text-text">
        <ArrowLeft size={14} /> К списку заявок
      </button>
      <PageHeader title={fullName} action={<Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-3 p-6 lg:col-span-2">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div><dt className="text-slate">Фамилия</dt><dd className="font-medium">{r.lastName}</dd></div>
            <div><dt className="text-slate">Имя</dt><dd className="font-medium">{r.firstName}</dd></div>
            <div><dt className="text-slate">Отчество</dt><dd className="font-medium">{r.middleName ?? '—'}</dd></div>
            <div><dt className="text-slate">Телефон</dt><dd className="font-medium">{r.phone}</dd></div>
            <div><dt className="text-slate">Направление</dt><dd className="font-medium">{r.destinationSnapshotTitle ?? '—'}</dd></div>
            <div><dt className="text-slate">Предложение</dt><dd className="font-medium">{r.offerSnapshotTitle ?? '—'}</dd></div>
            <div><dt className="text-slate">Взрослые / дети</dt><dd className="font-medium">{r.passengersAdults} / {r.passengersChildren}</dd></div>
            {r.childrenAges.length > 0 && (
              <div><dt className="text-slate">Возраст детей</dt><dd className="font-medium">{r.childrenAges.join(', ')}</dd></div>
            )}
            <div><dt className="text-slate">Дата вылета</dt><dd className="font-medium">{r.departureDate}</dd></div>
            <div><dt className="text-slate">Дата возврата</dt><dd className="font-medium">{r.returnDate ?? '—'}</dd></div>
            <div><dt className="text-slate">Локаль</dt><dd className="font-medium">{r.preferredLocale}</dd></div>
            <div><dt className="text-slate">Создано</dt><dd className="font-medium">{new Date(r.createdAtUtc).toLocaleString('ru')}</dd></div>
            <div><dt className="text-slate">Согласие получено</dt><dd className="font-medium">{new Date(r.consentAcceptedAtUtc).toLocaleString('ru')}</dd></div>
            <div><dt className="text-slate">Согласие на данные загранпаспорта</dt><dd className="font-medium">{new Date(r.passportDataConsentAcceptedAtUtc).toLocaleString('ru')}</dd></div>
          </dl>
          {r.message && (
            <div className="pt-2">
              <p className="text-sm text-slate">Сообщение</p>
              <p className="mt-1 whitespace-pre-line">{r.message}</p>
            </div>
          )}
          {r.passportPhotoPaths.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-sm text-slate">Фото загранпаспорта</p>
              <div className="flex flex-wrap gap-3">
                {r.passportPhotoPaths.map((fileName) => (
                  <PassportPhotoThumb key={fileName} requestId={r.id} fileName={fileName} />
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-3 p-6">
            <p className="text-sm font-medium text-slate">Изменить статус</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === r.status ? 'primary' : 'secondary'}
                  disabled={setStatus.isPending}
                  onClick={() => requestStatusChange(s)}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <FieldLabel htmlFor="assign-select">Ответственный менеджер</FieldLabel>
              <Select
                id="assign-select"
                value={r.assignedAdminUserId ?? ''}
                disabled={assign.isPending || assignable.isPending}
                onChange={(e) => assign.mutate(e.target.value || null)}
              >
                <option value="">Не назначен</option>
                {assignable.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName}
                  </option>
                ))}
              </Select>
              {admin && (
                <button
                  type="button"
                  className="mt-1.5 text-xs font-medium text-brand hover:underline disabled:opacity-40"
                  disabled={assign.isPending || r.assignedAdminUserId === admin.id}
                  onClick={() => assign.mutate(admin.id)}
                >
                  Назначить на себя
                </button>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate">Сумма сделки</p>
              {r.dealValue != null ? (
                <p className="text-lg font-medium">
                  {r.dealValue.toLocaleString('ru')} {r.dealCurrency}
                </p>
              ) : (
                <p className="text-sm text-slate">Не указана</p>
              )}
              <Button size="sm" variant="ghost" className="mt-1.5 -ml-2" onClick={() => setDealValueModalOpen(true)}>
                {r.dealValue != null ? 'Изменить сумму' : 'Указать сумму'}
              </Button>
            </div>

            <div>
              <FieldLabel htmlFor="follow-up-date">Напомнить связаться</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="follow-up-date"
                  type="date"
                  value={followUpDraft ?? (r.nextFollowUpAtUtc ? r.nextFollowUpAtUtc.slice(0, 10) : '')}
                  disabled={setFollowUp.isPending}
                  onChange={(e) => {
                    setFollowUpDraft(e.target.value)
                    if (e.target.value) setFollowUp.mutate(new Date(`${e.target.value}T09:00:00Z`).toISOString())
                  }}
                />
                {r.nextFollowUpAtUtc && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={setFollowUp.isPending}
                    onClick={() => {
                      setFollowUpDraft('')
                      setFollowUp.mutate(null)
                    }}
                  >
                    Снять
                  </Button>
                )}
              </div>
              {isOverdue && <p className="mt-1.5 text-xs font-medium text-danger">Просрочено</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <NotesSection requestId={id} />
      </div>

      {/* Full mutation audit trail — SuperAdmin only (see AdminAuditLogController). Editor's
          equivalent view of "what happened with this lead" is the notes feed above. */}
      {isSuperAdmin && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium">Журнал изменений</h2>
          {audit.isPending && <Skeleton className="h-24 w-full" />}
          {audit.isError && <ErrorState onRetry={() => audit.refetch()} />}
          {audit.isSuccess && audit.data.items.length === 0 && <EmptyState title="Изменений пока нет" />}
          {audit.isSuccess && audit.data.items.length > 0 && (
            <ul className="space-y-2">
              {audit.data.items.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-text/8 bg-elevated px-4 py-2.5 text-sm">
                  <span className="font-medium">{entry.action}</span>{' '}
                  <span className="text-slate">— {new Date(entry.timestampUtc).toLocaleString('ru')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <DealValueModal
        open={dealValueModalOpen}
        onClose={() => setDealValueModalOpen(false)}
        isPending={setDealValue.isPending || setStatus.isPending}
        onConfirm={(value, currency) => {
          setDealValue.mutate(
            { value, currency },
            {
              onSuccess: () => {
                setStatus.mutate('Won', {
                  onSuccess: () => {
                    showToast('Сделка закрыта успешно')
                    invalidateRequest()
                    setDealValueModalOpen(false)
                  },
                })
              },
            },
          )
        }}
      />
    </div>
  )
}
