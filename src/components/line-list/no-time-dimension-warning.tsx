import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import { useMemo, type FC } from 'react'
import classes from './styles/no-time-dimension-warning.module.css'
import type { LineListTransformedVisualization } from './types'

type NoTimeDimensionWarningProps = {
    isInModal: boolean
    visualization: LineListTransformedVisualization
}

// TODO remove dummy function
const isAoWithTimeDimension = (
    visualization: LineListTransformedVisualization
): boolean => {
    console.log(visualization.fontSize)
    return true
}

export const NoTimeDimensionWarning: FC<NoTimeDimensionWarningProps> = ({
    isInModal,
    visualization,
}) => {
    console.log(visualization)
    const hasTimeDimension = useMemo(
        () => isAoWithTimeDimension(visualization),
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
