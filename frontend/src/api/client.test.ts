import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { httpClient, apiGet } from '@/api/client'
import { ApiError } from '@/types/api'

describe('api error parsing', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
  })

  afterEach(() => {
    mock.restore()
  })

  it('maps a known errorCode straight through, using the RFC7807 detail as the message', async () => {
    mock.onGet('/offers/dubai').reply(409, {
      title: 'Conflict',
      status: 409,
      detail: 'A record like this already exists.',
      errorCode: 'CONFLICT_DUPLICATE',
    })

    await expect(apiGet('/offers/dubai')).rejects.toMatchObject({
      status: 409,
      errorCode: 'CONFLICT_DUPLICATE',
      message: 'A record like this already exists.',
    })
  })

  it('falls back to a status-derived errorCode when the backend errorCode is unrecognized', async () => {
    mock.onGet('/whatever').reply(404, { title: 'Not Found', status: 404 })

    const error = await apiGet('/whatever').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).errorCode).toBe('NOT_FOUND')
  })

  it('surfaces field-level validation errors from ProblemDetails.errors', async () => {
    mock.onGet('/thing').reply(400, {
      title: 'Validation failed',
      status: 400,
      errorCode: 'VALIDATION_FAILED',
      errors: { email: ['Email is required.'] },
    })

    const error = await apiGet('/thing').catch((e: unknown) => e)
    expect((error as ApiError).fieldErrors).toEqual({ email: ['Email is required.'] })
  })

  it('reports a network error (no response at all) distinctly from an HTTP error status', async () => {
    mock.onGet('/unreachable').networkError()

    const error = await apiGet('/unreachable').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).errorCode).toBe('NETWORK_ERROR')
  })
})
