import classes from '@components/dimension-modal/conditions-modal-content/styles/condition.module.css'
import i18n from '@dhis2/d2-i18n'
import { Button, IconDelete16, Tooltip } from '@dhis2/ui'
import { type FC } from 'react'

type ConditionRemoveButtonProps = {
    onClick: () => void
}

export const ConditionRemoveButton: FC<ConditionRemoveButtonProps> = ({
    onClick,
}) => (
    <Tooltip content={i18n.t('Delete filter')} openDelay={800}>
        {({ ref, onBlur, onFocus, onMouseOver, onMouseOut }) => (
            <span
                ref={ref}
                className={classes.removeButtonWrapper}
                onBlur={onBlur}
                onFocus={onFocus}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
            >
                <Button
                    type="button"
                    small
                    secondary
                    icon={<IconDelete16 />}
                    onClick={onClick}
                    aria-label={i18n.t('Delete filter')}
                    className={classes.removeButton}
                    dataTest="condition-remove-button"
                />
            </span>
        )}
    </Tooltip>
)
