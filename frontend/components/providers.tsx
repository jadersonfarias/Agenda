"use client"

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            </QueryClientProvider>
        </SessionProvider>
    )
}
