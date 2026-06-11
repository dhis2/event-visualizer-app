import i18n from '@dhis2/d2-i18n'
import { Button, IconAdd24, IconSubtract24 } from '@dhis2/ui'
import { useAppDispatch, useAppSelector } from '@hooks'
import {
    DEFAULT_REPETITIONS_OBJECT,
    getVisUiConfigRepetitionsByDimension,
    setVisUiConfigRepetitionsByDimension,
    type RepetitionsObject,
} from '@store/vis-ui-config-slice'
import { useCallback, type FC } from 'react'
import classes from './styles/conditions-modal-content.module.css'

type RepeatedEventsTabContentProps = {
    dimensionId: string
}

const MIN_TOTAL_EVENTS = 1

const getMinCount = (otherCount: number) =>
    Math.max(0, MIN_TOTAL_EVENTS - otherCount)

type RepetitionStepperProps = {
    label: string
    value: number
    minValue: number
    decrementLabel: string
    incrementLabel: string
    onChange: (value: number) => void
    dataTest: string
}

const RepetitionStepper: FC<RepetitionStepperProps> = ({
    label,
    value,
    minValue,
    decrementLabel,
    incrementLabel,
    onChange,
    dataTest,
}) => (
    <div
        className={classes.repeatableCard}
        data-active={value > 0}
        data-test={`${dataTest}-card`}
        role="group"
        aria-labelledby={`${dataTest}-label`}
    >
        <span id={`${dataTest}-label`} className={classes.repeatableCardHeader}>
            {label}
        </span>
        <div className={classes.repeatableStepper}>
            <Button
                secondary
                icon={<IconSubtract24 />}
                onClick={() => onChange(value - 1)}
                disabled={value <= minValue}
                aria-label={decrementLabel}
                dataTest={`${dataTest}-decrement`}
            />
            <span
                className={classes.repeatableValue}
                data-test={`${dataTest}-value`}
                aria-live="polite"
            >
                {value}
            </span>
            <Button
                secondary
                icon={<IconAdd24 />}
                onClick={() => onChange(value + 1)}
                aria-label={incrementLabel}
                dataTest={`${dataTest}-increment`}
            />
        </div>
    </div>
)

export const RepeatedEventsTabContent: FC<RepeatedEventsTabContentProps> = ({
    dimensionId,
}) => {
    const dispatch = useAppDispatch()

    const { mostRecent, oldest } = useAppSelector((state) =>
        getVisUiConfigRepetitionsByDimension(state, dimensionId)
    )

    const updateRepetitions = useCallback(
        (repetitions: RepetitionsObject) => {
            const { mostRecent: defaultMostRecent, oldest: defaultOldest } =
                DEFAULT_REPETITIONS_OBJECT

            if (
                repetitions.mostRecent === defaultMostRecent &&
                repetitions.oldest === defaultOldest
            ) {
                dispatch(setVisUiConfigRepetitionsByDimension({ dimensionId }))
            } else {
                dispatch(
                    setVisUiConfigRepetitionsByDimension({
                        dimensionId,
                        repetitions,
                    })
                )
            }
        },
        [dimensionId, dispatch]
    )

    const onOldestChange = useCallback(
        (oldestValue: number) =>
            updateRepetitions({ mostRecent, oldest: oldestValue }),
        [mostRecent, updateRepetitions]
    )

    const onMostRecentChange = useCallback(
        (mostRecentValue: number) =>
            updateRepetitions({ mostRecent: mostRecentValue, oldest }),
        [oldest, updateRepetitions]
    )

    return (
        <div>
            <p className={classes.repeatableIntro}>
                {i18n.t(
                    'From stages with repeatable events, show values from:',
                    { nsSeparator: '^^' }
                )}
            </p>
            <div className={classes.repeatableCards}>
                <RepetitionStepper
                    label={i18n.t('Oldest events')}
                    value={oldest}
                    minValue={getMinCount(mostRecent)}
                    decrementLabel={i18n.t('Show fewer of the oldest events')}
                    incrementLabel={i18n.t('Show more of the oldest events')}
                    onChange={onOldestChange}
                    dataTest="oldest"
                />
                <RepetitionStepper
                    label={i18n.t('Most recent events')}
                    value={mostRecent}
                    minValue={getMinCount(oldest)}
                    decrementLabel={i18n.t(
                        'Show fewer of the most recent events'
                    )}
                    incrementLabel={i18n.t(
                        'Show more of the most recent events'
                    )}
                    onChange={onMostRecentChange}
                    dataTest="most-recent"
                />
            </div>
        </div>
    )
}
