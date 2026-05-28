import { api, getApiErrorMessage } from '../../../lib/api'
import {
  type PlatformBusinessesResponse,
  type PlatformBusinessItem,
  type PlatformBusinessSubscriptionStatusAction,
  type UpdatePlatformBusinessSubscriptionInput,
  type UpdatePlatformBusinessSubscriptionStatusInput,
} from '../types'

const platformSubscriptionStatusActionEndpoints: Record<PlatformBusinessSubscriptionStatusAction, string> = {
  markPastDue: 'mark-past-due',
  cancelSubscription: 'cancel-subscription',
}

const platformSubscriptionStatusActionMessages: Record<PlatformBusinessSubscriptionStatusAction, string> = {
  markPastDue: 'Não foi possível marcar a assinatura como vencida',
  cancelSubscription: 'Não foi possível cancelar a assinatura',
}

export async function fetchPlatformBusinesses(page = 1, perPage = 20) {
  try {
    const response = await api.get<PlatformBusinessesResponse>('/platform/businesses', {
      params: { page, perPage },
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os clientes da plataforma'))
  }
}

export async function updatePlatformBusinessSubscription({
  businessId,
  plan,
  months,
  paymentMethod,
}: UpdatePlatformBusinessSubscriptionInput) {
  try {
    const response = await api.patch<PlatformBusinessItem>(`/platform/businesses/${businessId}/subscription`, {
      plan,
      months,
      paymentMethod,
    })

    return response.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Não foi possível ativar ou renovar o plano deste cliente'))
  }
}

export async function updatePlatformBusinessSubscriptionStatus({
  businessId,
  action,
}: UpdatePlatformBusinessSubscriptionStatusInput) {
  try {
    const endpoint = platformSubscriptionStatusActionEndpoints[action]
    const response = await api.patch<PlatformBusinessItem>(`/platform/businesses/${businessId}/${endpoint}`)

    return response.data
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, platformSubscriptionStatusActionMessages[action]),
    )
  }
}
