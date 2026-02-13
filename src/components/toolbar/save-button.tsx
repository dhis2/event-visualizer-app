import i18n from '@dhis2/d2-i18n'
import { Button, IconSave16 } from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import classes from './styles/button.module.css'
import { useToolbarActions } from './use-toolbar-actions'
import { useAppSelector } from '@hooks'
import { isVisualizationValidForSave } from '@modules/validation'
import {
    getVisualizationState,
    isVisualizationSaved,
} from '@modules/visualization'
import { getCurrentVis } from '@store/current-vis-slice'
import { getSavedVis } from '@store/saved-vis-slice'

export const SaveButton: FC = () => {
    const currentVis = useAppSelector(getCurrentVis)
    const savedVis = useAppSelector(getSavedVis)

    const { onSave } = useToolbarActions()

    const saveEnabled = useMemo(
        () =>
            ['UNSAVED', 'DIRTY'].includes(
                getVisualizationState(savedVis, currentVis)
            ) &&
            isVisualizationValidForSave({
                ...currentVis,
                legacy: savedVis?.legacy,
            }) &&
            isVisualizationSaved(savedVis) &&
            (!savedVis.id || savedVis.access?.update),
        [currentVis, savedVis]
    )

    return (
        <Button
            icon={<IconSave16 color="#6C7787 " />}
            onClick={onSave}
            dataTest="save-button"
            className={classes.button}
            small
            disabled={!saveEnabled}
        >
            {i18n.t('Save')}
        </Button>
    )
}
