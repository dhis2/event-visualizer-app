import { logger } from '@modules/logger'
import { useCallback, useRef } from 'react'

/* Guards against firing an analytics request identical to one already in
 * flight. reserve claims a request signature and returns false when the same
 * request is already running; call release once the request settles. */
export const useInFlightDedup = () => {
    const inFlightSignatureRef = useRef<string | null>(null)

    const reserve = useCallback((signature: string) => {
        if (inFlightSignatureRef.current === signature) {
            logger.debug(
                'Skipping analytics request, identical request already in flight'
            )
            return false
        }
        inFlightSignatureRef.current = signature
        return true
    }, [])

    const release = useCallback((signature: string) => {
        if (inFlightSignatureRef.current === signature) {
            inFlightSignatureRef.current = null
        }
    }, [])

    return { reserve, release }
}
