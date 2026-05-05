import { BadRequestException } from '@nestjs/common'

export type PaginationParams = {
  page: number
  perPage: number
}

export type PaginationMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export type PaginatedResult<T> = {
  data: T[]
  meta: PaginationMeta
}

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

export function parsePaginationParams(page?: string, perPage?: string): PaginationParams | null {
  if (page === undefined && perPage === undefined) {
    return null
  }

  const pageNumber = page !== undefined ? Number(page) : DEFAULT_PAGE
  const perPageNumber = perPage !== undefined ? Number(perPage) : DEFAULT_PER_PAGE

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new BadRequestException('page deve ser um inteiro maior que zero')
  }

  if (!Number.isInteger(perPageNumber) || perPageNumber < 1 || perPageNumber > MAX_PER_PAGE) {
    throw new BadRequestException(`perPage deve ser um inteiro entre 1 e ${MAX_PER_PAGE}`)
  }

  return {
    page: pageNumber,
    perPage: perPageNumber,
  }
}

export function buildPaginationMeta(total: number, pagination: PaginationParams): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pagination.perPage))

  return {
    page: pagination.page,
    perPage: pagination.perPage,
    total,
    totalPages,
  }
}
