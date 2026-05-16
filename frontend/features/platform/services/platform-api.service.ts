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

async function requestPlatformBusinessesPage(page: number, perPage: number) {
  const response = await api.get<PlatformBusinessesResponse>('/platform/businesses', {
    params: { page, perPage },
  })

  return response.data
}

export async function fetchPlatformBusinesses(page = 1, perPage = 20) {
  try {
    const firstPage = await requestPlatformBusinessesPage(page, perPage)

    if (page !== 1 || firstPage.meta.totalPages <= 1) {
      return firstPage
    }

    const remainingPages = Array.from(
      { length: Math.max(firstPage.meta.totalPages - 1, 0) },
      (_value, index) => index + 2,
    )

    if (remainingPages.length === 0) {
      return firstPage
    }

    const remainingResults = await Promise.all(
      remainingPages.map((currentPage) => requestPlatformBusinessesPage(currentPage, perPage)),
    )

    const data = [
      ...firstPage.data,
      ...remainingResults.flatMap((result) => result.data),
    ]

    return {
      data,
      meta: {
        ...firstPage.meta,
        perPage: data.length,
      },
    }
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
