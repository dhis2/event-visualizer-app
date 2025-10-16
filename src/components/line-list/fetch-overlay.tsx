import { Center, CircularLoader, Cover } from '@dhis2/ui'
import type { FC } from 'react'

export const FetchOverlay: FC = () => (
    <Cover>
        <Center>
            <CircularLoader />
        </Center>
    </Cover>
)
