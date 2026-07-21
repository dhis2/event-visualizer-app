import { visTypeDisplayNames } from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { Button, Tooltip } from '@dhis2/ui'
import { useAppSelector } from '@hooks'
import { isVisualizationEmpty } from '@modules/visualization/state'
import { getCurrentVis } from '@store/current-vis-slice'
import { getVisUiConfigVisualizationType } from '@store/vis-ui-config-slice'
import { type FC } from 'react'

type UpdateButtonProps = {
    onClick?: () => void
    dataTest?: string
    type?: 'button' | 'submit'
    form?: string
}

export const UpdateButton: FC<UpdateButtonProps> = ({
    onClick,
    dataTest = 'update-button',
    type = 'button',
    form,
}) => {
    const currentVis = useAppSelector(getCurrentVis)
    const visType = useAppSelector(getVisUiConfigVisualizationType)

    if (isVisualizationEmpty(currentVis)) {
        return (
            <Tooltip
                content={i18n.t('Create a {{- visType}} before updating', {
                    visType: visTypeDisplayNames[visType],
                })}
            >
                {({ onMouseOver, onMouseOut, onFocus, onBlur, ref }) => (
                    <span
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        ref={ref}
                    >
                        <Button
                            disabled
                            type={type}
                            form={form}
                            dataTest={dataTest}
                        >
                            {i18n.t('Update')}
                        </Button>
                    </span>
                )}
            </Tooltip>
        )
    }

    return (
        <Button
            type={type}
            form={form}
            primary
            onClick={onClick}
            dataTest={dataTest}
        >
            {i18n.t('Update')}
        </Button>
    )
}
