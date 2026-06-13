import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { BusinessesService } from '../../src/businesses/businesses.service'

describe('BusinessesService public business lookup', () => {
  it('retorna serviços públicos com description opcional', async () => {
    const services = [
      {
        id: 'service-1',
        name: 'Corte',
        description: 'Corte com acabamento.',
        price: { toString: () => '80' },
        durationMinutes: 60,
      },
      {
        id: 'service-2',
        name: 'Barba',
        description: null,
        price: { toString: () => '50' },
        durationMinutes: 30,
      },
    ]
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({
        id: 'business-1',
        name: 'Negócio Padrão',
        slug: 'default-business',
      }),
      findServices: vi.fn().mockResolvedValue(services),
    } as any
    const timezoneService = {} as any
    const availabilityCacheService = {} as any
    const prisma = {} as any

    const service = new BusinessesService(
      businessesRepository,
      timezoneService,
      availabilityCacheService,
      prisma
    )

    await expect(service.getServices('default-business')).resolves.toEqual(services)
    expect(businessesRepository.findServices).toHaveBeenCalledWith('business-1', null)
  })

  it('retorna os dados públicos do negócio quando encontra o slug', async () => {
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue({
        id: 'business-1',
        name: 'Negócio Padrão',
        slug: 'default-business',
      }),
    } as any
    const timezoneService = {} as any
    const availabilityCacheService = {} as any
    const prisma = {} as any

    const service = new BusinessesService(
      businessesRepository,
      timezoneService,
      availabilityCacheService,
      prisma
    )

    await expect(service.getPublicBusinessBySlug('default-business')).resolves.toEqual({
      id: 'business-1',
      name: 'Negócio Padrão',
      slug: 'default-business',
    })
  })

  it('lança NotFound quando o slug não existe', async () => {
    const businessesRepository = {
      findBusinessById: vi.fn().mockResolvedValue(null),
    } as any
    const timezoneService = {} as any
    const availabilityCacheService = {} as any
    const prisma = {} as any

    const service = new BusinessesService(
      businessesRepository,
      timezoneService,
      availabilityCacheService,
      prisma
    )

    await expect(service.getPublicBusinessBySlug('slug-inexistente')).rejects.toThrowError(NotFoundException)
  })
})
