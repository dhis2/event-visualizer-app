/* An error caught by a React error boundary is also re-dispatched to `window`, where
   jsdom's virtual console writes it to stderr. That path never reaches `console.error`,
   so neither `suppressConsoleError` nor the `onConsoleLog` filter in vitest.config.mts
   can silence it — only marking the event handled does. Wrap a test that triggers a
   boundary on purpose, so its expected error stops printing a stack trace on every run
   while unexpected ones stay visible. */
export const suppressWindowError = (
    messageToMatch: string,
    fn: () => void | Promise<void>
) => {
    return async () => {
        const onError = (event: ErrorEvent) => {
            const message =
                event.error instanceof Error
                    ? event.error.message
                    : event.message

            if (message.includes(messageToMatch)) {
                event.preventDefault()
            }
        }

        window.addEventListener('error', onError)

        try {
            await fn()
        } finally {
            window.removeEventListener('error', onError)
        }
    }
}
