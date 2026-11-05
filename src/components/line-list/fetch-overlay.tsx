import { Center, CircularLoader, Cover } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/fetch-overlay.module.css'

export const FetchOverlay: FC = () => (
    <Cover className={classes.overlay} dataTest="fetch-overlay">
        <Center>
            <CircularLoader />
        </Center>
    </Cover>
)
