import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MockAdapter from 'axios-mock-adapter'
import '@/i18n' // ErrorState (shared UI, used by admin pages too) reads i18next for its default copy
import { httpClient } from '@/api/client'
import { ToastProvider } from '@/components/ui/Toast'
import { ServicesListPage } from '@/admin/pages/services/ServicesListPage'

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <ServicesListPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const emptyPage = { items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 }

describe('ServicesListPage (admin list) — loading/error/empty/success', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
  })

  afterEach(() => {
    mock.restore()
  })

  it('shows a loading skeleton while the request is in flight', () => {
    mock.onGet(/\/admin\/services/).reply(() => new Promise(() => {}))
    const { container } = renderPage()

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows the error state with a retry action when the request fails', async () => {
    mock.onGet(/\/admin\/services/).reply(500)
    renderPage()

    expect(await screen.findByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('shows the empty state when there are no services yet', async () => {
    mock.onGet(/\/admin\/services/).reply(200, emptyPage)
    renderPage()

    expect(await screen.findByText('Услуг пока нет')).toBeInTheDocument()
  })

  it('renders a data table row once services load successfully', async () => {
    // Matches the real AdminServiceDto shape (backend/Application/Features/Services/Dtos/ServiceDtos.cs)
    // — no top-level name/description, only translations[] (locale serialized as the raw C#
    // enum member name, "Ru"/"Tg"/"En" — see src/lib/translations.ts).
    mock.onGet(/\/admin\/services/).reply(200, {
      ...emptyPage,
      items: [
        {
          id: '1',
          icon: 'plane',
          isPublished: true,
          sortOrder: 0,
          translations: [{ locale: 'Ru', name: 'Визовая поддержка', description: '' }],
        },
      ],
      totalCount: 1,
    })
    renderPage()

    expect(await screen.findByText('Визовая поддержка')).toBeInTheDocument()
    expect(screen.getByText('Опубликовано')).toBeInTheDocument()
  })
})
