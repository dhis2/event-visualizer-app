export const suppressConsoleError = (
    messageToMatch: string,
    fn: () => Promise<void>
) => {
    return async () => {
        const originalConsoleError = console.error
        console.error = (...args: unknown[]) => {
            // Check if any argument contains our target message
            const shouldSuppress = args.some((arg) => {
                if (typeof arg === 'string') {
                    return arg.includes(messageToMatch)
                }
                if (arg instanceof Error) {
                    return arg.message.includes(messageToMatch)
                }
                return false
            })

            if (shouldSuppress) {
                return // Suppress this specific error
            }

            originalConsoleError(...args) // Let original console.error do its thing
        }

        try {
            await fn()
        } finally {
            console.error = originalConsoleError
        }
    }
}
