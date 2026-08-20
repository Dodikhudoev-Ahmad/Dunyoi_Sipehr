import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MockAdapter from 'axios-mock-adapter'
import '@/i18n'
import { httpClient } from '@/api/client'
import { LocaleProvider } from '@/i18n/LocaleContext'
import { TravelRequestPage } from '@/pages/public/TravelRequestPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/travel-request']}>
        <LocaleProvider locale="ru">
          <TravelRequestPage />
        </LocaleProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TravelRequestPage form validation', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
    const emptyPage = { items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 }
    mock.onGet(/\/public\/destinations/).reply(200, emptyPage)
    mock.onGet(/\/public\/offers/).reply(200, emptyPage)
  })

  afterEach(() => {
    mock.restore()
  })

  it('blocks submission and shows required-field errors when the form is empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /оставить заявку|отправ/i }))

    // fullName uses zod's min(2) rule, which also rejects an empty string ("Минимум 2 символов")
    // rather than a distinct "required" message — see lib/validation.ts.
    expect(await screen.findByText('Минимум 2 символов')).toBeInTheDocument()
    expect(screen.getByText('Введите корректный адрес эл. почты')).toBeInTheDocument()
    expect(screen.getByText('Введите корректный номер телефона')).toBeInTheDocument()
    expect(screen.getByText('Необходимо согласие на обработку данных')).toBeInTheDocument()

    // No POST /public/travel-requests should have been attempted.
    expect(mock.history.post ?? []).toHaveLength(0)
  })

  it('accepts a fully valid submission (required fields filled, consent checked)', async () => {
    mock.onPost('/public/travel-requests').reply(201, { id: 'new-id' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Полное имя'), 'Иван Иванов')
    await user.type(screen.getByLabelText('Эл. почта'), 'ivan@example.com')
    await user.type(screen.getByLabelText('Телефон'), '+992900000000')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /оставить заявку|отправ/i }))

    await waitFor(() => expect(mock.history.post).toHaveLength(1))
    const [request] = mock.history.post
    expect(JSON.parse(request!.data as string)).toMatchObject({
      fullName: 'Иван Иванов',
      email: 'ivan@example.com',
      consentAccepted: true,
    })
  })
})
