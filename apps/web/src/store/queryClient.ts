import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
      // Unlike apps/mobile: a staff dashboard benefits from refreshing when the tab
      // regains focus (someone tabbing back after a break should see current data).
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
})
