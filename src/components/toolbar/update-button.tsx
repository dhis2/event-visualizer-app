import type { FC } from 'react'
import { UpdateButton as UiUpdateButton } from '@dhis2/analytics'

export const UpdateButton: FC = () => {
    const onClick = () => {
        console.log('TBD')
    }

    /* TODO: under certain conditions we probably want to
     * disable this button and/or set a loading state */
    return <UiUpdateButton onClick={onClick} />
}
