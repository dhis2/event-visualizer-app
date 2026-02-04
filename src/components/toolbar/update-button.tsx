import type { FC } from 'react'
import { UpdateButton as UiUpdateButton } from '@dhis2/analytics'
import { useAppDispatch } from '@hooks'
import { tUpdateCurrentVisFromVisUiConfig } from '@store/thunks'

export const UpdateButton: FC = () => {
    const dispatch = useAppDispatch()

    const onClick = () => dispatch(tUpdateCurrentVisFromVisUiConfig())

    return <UiUpdateButton onClick={onClick} />
}
