import { Center, CircularLoader, Cover } from '@dhis2/ui'
import type { FC } from 'react'

export const FetchOverlay: FC = () => (
    <Cover dataTest="fetch-overlay">
        <Center>
            <CircularLoader />
        </Center>
    </Cover>
)
