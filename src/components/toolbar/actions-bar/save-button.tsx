import i18n from '@dhis2/d2-i18n'
import { Button, IconSave16 } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/button.module.css'
import { useToolbarActions } from './use-toolbar-actions'
import { useAppSelector } from '@hooks'
import { getSavedVis } from '@store/saved-vis-slice'

export const SaveButton: FC = () => {
    const savedVis = useAppSelector(getSavedVis)

    const { isSaveEnabled, onSave } = useToolbarActions()

    return (
        <Button
            icon={<IconSave16 color="#6C7787 " />}
            onClick={onSave}
            dataTest="save-button"
            className={classes.button}
            small
            disabled={!isSaveEnabled}
        >
            <span className={classes.label}>
                {savedVis.id ? i18n.t('Save') : i18n.t('Save…')}
            </span>
        </Button>
    )
}
