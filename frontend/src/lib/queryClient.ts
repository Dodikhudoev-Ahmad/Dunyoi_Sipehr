import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/types/api'

// Registers ApiError as the default error type for every useQuery/useMutation call,
// so components can read `.status` / `.errorCode` without re-casting each time.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
