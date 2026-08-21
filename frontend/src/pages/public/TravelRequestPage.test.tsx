import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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

    // lastName/firstName use zod's min(2) rule, which also rejects an empty string
    // ("Минимум 2 символов") rather than a distinct "required" message — see lib/validation.ts.
    expect(await screen.findAllByText('Минимум 2 символов')).toHaveLength(2)
    expect(screen.getByText('Введите корректный номер телефона')).toBeInTheDocument()
    expect(screen.getByText('Необходимо согласие на обработку данных')).toBeInTheDocument()

    // No POST /public/travel-requests should have been attempted.
    expect(mock.history.post ?? []).toHaveLength(0)
  })

  it('accepts a fully valid submission (required fields filled, both consents checked, photo uploaded)', async () => {
    mock.onPost('/public/travel-requests/passport-photos').reply(200, 'uploaded-passport.jpg')
    mock.onPost('/public/travel-requests').reply(201, { id: 'new-id' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Фамилия'), 'Иванов')
    await user.type(screen.getByLabelText('Имя'), 'Иван')
    await user.type(screen.getByLabelText('Телефон'), '900000000')

    const departureDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    fireEvent.change(screen.getByLabelText('Дата вылета'), { target: { value: departureDate } })

    const photoFile = new File(['fake-image-bytes'], 'passport.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText('Добавить фото'), photoFile)
    await waitFor(() => expect(mock.history.post!.some((r) => r.url?.includes('passport-photos'))).toBe(true))
    await screen.findByRole('button', { name: 'Удалить' }) // photo upload finished — remove button only renders once status is 'done' or 'error'

    await user.click(screen.getByLabelText('Я согласен(на) на обработку персональных данных'))
    await user.click(screen.getByLabelText('Я согласен(на) на обработку данных загранпаспорта/персональных данных для оформления билета'))
    await user.click(screen.getByRole('button', { name: /оставить заявку|отправ/i }))

    await waitFor(() => expect(mock.history.post!.filter((r) => r.url === '/public/travel-requests')).toHaveLength(1))
    const [request] = mock.history.post!.filter((r) => r.url === '/public/travel-requests')
    expect(JSON.parse(request!.data as string)).toMatchObject({
      lastName: 'Иванов',
      firstName: 'Иван',
      phone: '+992900000000',
      passportPhotoPaths: ['uploaded-passport.jpg'],
      consentAccepted: true,
      passportDataConsentAccepted: true,
    })
  })
})
