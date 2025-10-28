"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    // State to track if the component is mounted
    const [mounted, setMounted] = React.useState(false)
    
    // Effect to ensure the component is mounted before rendering
    React.useEffect(() => {
        setMounted(true)
    }, [])

    // If the component is not mounted, return the children
    if (!mounted) {
        return <>{children}</>
    }
  return (mounted && <NextThemesProvider {...props}>{children}</NextThemesProvider>)
}