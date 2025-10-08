export const suppressConsoleError = (
    messageToMatch: string,
    fn: () => Promise<void>
) => {
    return async () => {
        const originalConsoleError = console.error
        console.error = (
            errorOrMessage: string | Error,
            ...rest: unknown[]
        ) => {
            const shouldSuppress =
                (typeof errorOrMessage === 'string' &&
                    errorOrMessage.includes(messageToMatch)) ||
                (errorOrMessage instanceof Error &&
                    errorOrMessage.message.includes(messageToMatch))

            if (shouldSuppress) {
                return // Suppress this specific error
            }

            originalConsoleError(errorOrMessage, ...rest)
        }

        try {
            await fn()
        } finally {
            console.error = originalConsoleError
        }
    }
}
