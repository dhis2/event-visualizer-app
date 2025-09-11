import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import classes from './styles/no-time-dimension-warning.module.css'
import { isVisualizationWithTimeDimension } from '@modules/visualization'
import type { CurrentVisualization } from '@types'

type NoTimeDimensionWarningProps = {
    isInModal: boolean
    visualization: CurrentVisualization
}

export const NoTimeDimensionWarning: FC<NoTimeDimensionWarningProps> = ({
    isInModal,
    visualization,
}) => {
    const hasTimeDimension = useMemo(
        () => isVisualizationWithTimeDimension(visualization),
        [visualization]
    )
    return isInModal && !hasTimeDimension ? (
        <div className={classes.container}>
            <NoticeBox warning>
                {i18n.t(
                    'This line list may show data that was not available when the interpretation was written.'
                )}
            </NoticeBox>
        </div>
    ) : null
}
