import type { FC } from 'react'
import { UpdateButton as UiUpdateButton } from '@dhis2/analytics'

export const UpdateButton: FC = () => {
    const onClick = () => {
        console.log('TBD update button callback')
    }

    return <UiUpdateButton onClick={onClick} />
}
