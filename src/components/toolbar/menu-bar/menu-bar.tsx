import type { FC } from 'react'
import { ViewMenu } from './view-menu'
import { HoverMenuBar } from '@dhis2/analytics'

export const MenuBar: FC = () => {
    return (
        <HoverMenuBar>
            <ViewMenu />
        </HoverMenuBar>
    )
}
