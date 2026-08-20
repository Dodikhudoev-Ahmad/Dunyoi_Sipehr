import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MockAdapter from 'axios-mock-adapter'
import '@/i18n'
import { httpClient } from '@/api/client'
import { LocaleProvider } from '@/i18n/LocaleContext'
import { ServicesPage } from '@/pages/public/ServicesPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LocaleProvider locale="ru">
          <ServicesPage />
        </LocaleProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ServicesPage (public list) — loading/error/empty/success', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
  })

  afterEach(() => {
    mock.restore()
  })

  it('shows a loading skeleton while the request is in flight', () => {
    mock.onGet(/\/public\/services/).reply(() => new Promise(() => {})) // never resolves
    const { container } = renderPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('Услуги скоро появятся.')).not.toBeInTheDocument()
  })

  it('shows the error state with a retry action when the request fails', async () => {
    mock.onGet(/\/public\/services/).reply(500)
    renderPage()

    expect(await screen.findByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('shows the empty state when the list is empty', async () => {
    mock.onGet(/\/public\/services/).reply(200, [])
    renderPage()

    expect(await screen.findByText('Услуги скоро появятся.')).toBeInTheDocument()
  })

  it('renders the services once they load successfully', async () => {
    mock.onGet(/\/public\/services/).reply(200, [
      { id: '1', icon: 'plane', name: 'Авиабилеты', description: 'Подбор и оформление рейсов' },
    ])
    renderPage()

    expect(await screen.findByText('Авиабилеты')).toBeInTheDocument()
  })
})
