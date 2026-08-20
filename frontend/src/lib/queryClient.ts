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
      // Defense-in-depth default: without this, the library default (staleTime: 0) means any
      // query that forgets to set its own staleTime refetches instantly on every remount, even
      // for data that's already in the cache — visible as a network request (and a stale→fresh
      // flicker) on ordinary back/forward navigation. Public catalog hooks already set a longer
      // 5-minute staleTime themselves (usePublicData.ts); this just raises the floor for
      // everything else (admin queries, any hook added later) instead of leaving it at zero.
      staleTime: 60_000,
    },
  },
})
