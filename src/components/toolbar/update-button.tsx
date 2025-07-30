import { UpdateButton as UiUpdateButton } from '@dhis2/analytics'
import React from 'react'

const UpdateButton = () => {
    const onClick = () => {
        console.log('TBD')
    }

    /* TODO: under certain conditions we probably want to
     * disable this button and/or set a loading state */
    return <UiUpdateButton onClick={onClick} />
}

export default UpdateButton
