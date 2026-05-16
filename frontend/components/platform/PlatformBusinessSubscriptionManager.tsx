'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { usePlatformUpdateBusinessSubscriptionMutation } from '../../features/platform/hooks/use-platform-update-business-subscription-mutation'
import { usePlatformUpdateBusinessSubscriptionStatusMutation } from '../../features/platform/hooks/use-platform-update-business-subscription-status-mutation'
import { platformSubscriptionStatusLabels } from '../../features/platform/presentation'
import {
  type PlatformBusinessSubscriptionStatusAction,
  type PlatformBusinessItem,
  type PlatformManualPaymentMethod,
  type PlatformSubscriptionMonths,
  type PlatformSubscriptionPlan,
} from '../../features/platform/types'
import { formatIsoCalendarDate } from '../../lib/date-format'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Label } from '../ui/label'
import { Modal } from '../ui/modal'
import { Select } from '../ui/select'

const platformSubscriptionFormSchema = z.object({
  plan: z.enum(['BASIC', 'PRO']),
  months: z.coerce
    .number()
    .refine((value) => [1, 3, 6, 12].includes(value), 'Selecione um período válido'),
  paymentMethod: z.enum(['PIX', 'MANUAL']),
})

type PlatformSubscriptionFormValues = z.infer<typeof platformSubscriptionFormSchema>

const paymentMethodLabels: Record<PlatformManualPaymentMethod, string> = {
  PIX: 'Pix',
  MANUAL: 'Manual',
}

function getDefaultPlan(plan: PlatformBusinessItem['plan']): PlatformSubscriptionPlan {
  return plan === 'PRO' ? 'PRO' : 'BASIC'
}

function getDefaultPaymentMethod(
  paymentMethod: PlatformBusinessItem['paymentMethod'],
): PlatformManualPaymentMethod {
  return paymentMethod === 'MANUAL' ? 'MANUAL' : 'PIX'
}

function getFormDefaults(business: PlatformBusinessItem): PlatformSubscriptionFormValues {
  return {
    plan: getDefaultPlan(business.plan),
    months: 1,
    paymentMethod: getDefaultPaymentMethod(business.paymentMethod),
  }
}

function formatMonthsLabel(months: PlatformSubscriptionMonths) {
  return months === 1 ? '1 mês' : `${months} meses`
}

const subscriptionStatusActionContent: Record<
  PlatformBusinessSubscriptionStatusAction,
  {
    title: string
    description: string
    confirmLabel: string
    successMessage: string
    buttonVariant: 'secondary' | 'danger'
    buttonLabel: string
    pendingLabel: string
  }
> = {
  markPastDue: {
    title: 'Marcar como vencido',
    description:
      'Essa ação vai atualizar o status da assinatura para vencida, sem excluir o negócio nem alterar memberships.',
    confirmLabel: 'Confirmar vencimento',
    successMessage: 'Assinatura marcada como vencida com sucesso',
    buttonVariant: 'secondary',
    buttonLabel: 'Marcar como vencido',
    pendingLabel: 'Marcando...',
  },
  cancelSubscription: {
    title: 'Cancelar assinatura',
    description:
      'Essa ação vai cancelar a assinatura atual do cliente, sem excluir o negócio nem alterar memberships.',
    confirmLabel: 'Confirmar cancelamento',
    successMessage: 'Assinatura cancelada com sucesso',
    buttonVariant: 'danger',
    buttonLabel: 'Cancelar assinatura',
    pendingLabel: 'Cancelando...',
  },
}

export function PlatformBusinessSubscriptionManager({
  business,
}: {
  business: PlatformBusinessItem
}) {
  const queryClient = useQueryClient()
  const updateSubscriptionMutation = usePlatformUpdateBusinessSubscriptionMutation()
  const updateSubscriptionStatusMutation = usePlatformUpdateBusinessSubscriptionStatusMutation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmationAction, setConfirmationAction] =
    useState<PlatformBusinessSubscriptionStatusAction | null>(null)
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<PlatformSubscriptionFormValues>({
    resolver: zodResolver(platformSubscriptionFormSchema),
    defaultValues: getFormDefaults(business),
  })

  useEffect(() => {
    reset(getFormDefaults(business))
  }, [business, reset])

  const isActionPending =
    updateSubscriptionMutation.isPending || updateSubscriptionStatusMutation.isPending
  const confirmationContent = confirmationAction
    ? subscriptionStatusActionContent[confirmationAction]
    : null

  const handleClose = () => {
    if (isActionPending) {
      return
    }

    reset(getFormDefaults(business))
    setIsModalOpen(false)
  }

  const handleCloseConfirmation = () => {
    if (isActionPending) {
      return
    }

    setConfirmationAction(null)
  }

  const handleOpen = () => {
    reset(getFormDefaults(business))
    setIsModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        businessId: business.id,
        plan: values.plan,
        months: values.months as PlatformSubscriptionMonths,
        paymentMethod: values.paymentMethod,
      })

      await queryClient.invalidateQueries({ queryKey: ['platform-businesses'] })
      toast.success('Plano atualizado com sucesso')
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o plano')
    }
  })

  const handleSubscriptionStatusAction = async (action: PlatformBusinessSubscriptionStatusAction) => {
    try {
      await updateSubscriptionStatusMutation.mutateAsync({
        businessId: business.id,
        action,
      })

      await queryClient.invalidateQueries({ queryKey: ['platform-businesses'] })
      toast.success(subscriptionStatusActionContent[action].successMessage)
      setConfirmationAction(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a assinatura')
    }
  }

  return (
    <>
      <Card className="border-purple-200 bg-white shadow-lg shadow-purple-100/50">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[.25em] text-purple-700 sm:text-sm">
              Cliente selecionado
            </p>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{business.name}</h2>
              <p className="text-sm text-slate-500 sm:text-base">
                {business.slug} • {business.owner.name} • {business.owner.email}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Plano atual</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{business.plan}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {platformSubscriptionStatusLabels[business.subscriptionStatus]}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Assinatura até</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatIsoCalendarDate(business.subscriptionEndsAt) ?? '-'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Último pagamento</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {business.paymentMethod
                  ? `${paymentMethodLabels[business.paymentMethod]} • ${formatIsoCalendarDate(business.lastPaymentAt) ?? '-'}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-dashed border-purple-200 bg-purple-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Ativação manual de plano</h3>
              <p className="text-sm text-slate-600">
                Use esta ação para confirmar Pix ou outro pagamento manual e renovar a assinatura.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleOpen}
              disabled={isActionPending}
              className="min-h-12 sm:w-auto"
            >
              Ativar ou renovar plano
            </Button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Ações de assinatura</h3>
                <p className="text-sm text-slate-600">
                  Marque o plano como vencido ou cancele a assinatura manualmente quando necessário.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isActionPending}
                  onClick={() => setConfirmationAction('markPastDue')}
                  className="min-h-12"
                >
                  {updateSubscriptionStatusMutation.isPending && confirmationAction === 'markPastDue'
                    ? subscriptionStatusActionContent.markPastDue.pendingLabel
                    : subscriptionStatusActionContent.markPastDue.buttonLabel}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={isActionPending}
                  onClick={() => setConfirmationAction('cancelSubscription')}
                  className="min-h-12"
                >
                  {updateSubscriptionStatusMutation.isPending && confirmationAction === 'cancelSubscription'
                    ? subscriptionStatusActionContent.cancelSubscription.pendingLabel
                    : subscriptionStatusActionContent.cancelSubscription.buttonLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        title="Ativar ou renovar plano"
        description={`Confirme o plano manual para ${business.name}.`}
        open={isModalOpen}
        onClose={handleClose}
      >
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Label className="space-y-2">
            <span className="text-sm font-medium sm:text-base">Plano</span>
            <Select {...register('plan')}>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
            </Select>
            {errors.plan ? (
              <p className="text-xs text-red-600 sm:text-sm">{errors.plan.message}</p>
            ) : null}
          </Label>

          <Label className="space-y-2">
            <span className="text-sm font-medium sm:text-base">Período</span>
            <Select {...register('months')}>
              {[1, 3, 6, 12].map((monthsOption) => (
                <option key={monthsOption} value={monthsOption}>
                  {formatMonthsLabel(monthsOption as PlatformSubscriptionMonths)}
                </option>
              ))}
            </Select>
            {errors.months ? (
              <p className="text-xs text-red-600 sm:text-sm">{errors.months.message}</p>
            ) : null}
          </Label>

          <Label className="space-y-2">
            <span className="text-sm font-medium sm:text-base">Forma de pagamento</span>
            <Select {...register('paymentMethod')}>
              <option value="PIX">PIX</option>
              <option value="MANUAL">MANUAL</option>
            </Select>
            {errors.paymentMethod ? (
              <p className="text-xs text-red-600 sm:text-sm">{errors.paymentMethod.message}</p>
            ) : null}
          </Label>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isActionPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isActionPending}
              className="min-h-12 sm:w-auto lg:min-h-0"
            >
              {updateSubscriptionMutation.isPending ? 'Salvando...' : 'Confirmar renovação'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={confirmationContent?.title ?? 'Confirmar ação'}
        description={confirmationContent ? `${confirmationContent.description} Cliente: ${business.name}.` : ''}
        open={Boolean(confirmationAction)}
        onClose={handleCloseConfirmation}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[.2em] text-slate-500">Status atual</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {platformSubscriptionStatusLabels[business.subscriptionStatus]}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseConfirmation}
              disabled={isActionPending}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant={confirmationContent?.buttonVariant ?? 'danger'}
              onClick={() => {
                if (!confirmationAction) {
                  return
                }

                void handleSubscriptionStatusAction(confirmationAction)
              }}
              disabled={isActionPending}
              className="min-h-12 sm:w-auto lg:min-h-0"
            >
              {updateSubscriptionStatusMutation.isPending && confirmationContent
                ? confirmationContent.pendingLabel
                : confirmationContent?.confirmLabel ?? 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
