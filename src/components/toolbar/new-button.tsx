import i18n from '@dhis2/d2-i18n'
import { Button, IconAdd16 } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/button.module.css'
import { useToolbarActions } from './use-toolbar-actions'

export const NewButton: FC = () => {
    const { onNew } = useToolbarActions()

    return (
        <Button
            icon={<IconAdd16 color="#6C7787 " />}
            onClick={onNew}
            dataTest="new-button"
            className={classes.button}
            small
        >
            {i18n.t('New')}
        </Button>
    )
}
