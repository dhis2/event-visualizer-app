import { Center, CircularLoader, Cover } from '@dhis2/ui'
import type { FC } from 'react'

export const FetchOverlay: FC = () => (
    <Cover translucent>
        <Center>
            <CircularLoader />
        </Center>
    </Cover>
)
