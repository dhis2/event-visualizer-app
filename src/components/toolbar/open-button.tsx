import i18n from '@dhis2/d2-i18n'
import { Button, IconFolderOpen16 } from '@dhis2/ui'
import { useCallback, type FC } from 'react'
import classes from './styles/button.module.css'

export const OpenButton: FC = () => {
    const onClick = useCallback(() => console.log('TBD'), [])

    return (
        <Button
            icon={<IconFolderOpen16 color="#6C7787 " />}
            onClick={onClick}
            dataTest="open-button"
            className={classes.button}
            small
        >
            {i18n.t('Open')}
        </Button>
    )
}
