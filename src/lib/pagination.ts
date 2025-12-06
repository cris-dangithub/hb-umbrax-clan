export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Parse and validate pagination parameters from query strings
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number } {
  let page = 1
  let limit = defaultLimit

  // Handle both URLSearchParams and Record types
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  const pageParam = getParam('page')
  const limitParam = getParam('limit')

  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10)
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage
    }
  }

  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10)
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, maxLimit)
    }
  }

  return { page, limit }
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationResult {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Calculate skip value for Prisma queries
 */
export function getSkipValue(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Parse search query parameter
 */
export function parseSearchParam(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): string | undefined {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  const search = getParam('search')
  return search && search.trim().length > 0 ? search.trim() : undefined
}

/**
 * Parse integer parameter (e.g., rankId)
 */
export function parseIntParam(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  paramName: string
): number | undefined {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  const param = getParam(paramName)
  if (!param) return undefined

  const parsed = parseInt(param, 10)
  return !isNaN(parsed) ? parsed : undefined
}

/**
 * Parse boolean parameter
 */
export function parseBooleanParam(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  paramName: string
): boolean | undefined {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined
    }
    const value = searchParams[key]
    return Array.isArray(value) ? value[0] : value
  }

  const param = getParam(paramName)
  if (!param) return undefined

  return param === 'true' || param === '1'
}

/**
 * Build pagination response for API endpoints
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  const pagination = calculatePagination(page, limit, total)

  return {
    success: true,
    data,
    pagination,
  }
}
