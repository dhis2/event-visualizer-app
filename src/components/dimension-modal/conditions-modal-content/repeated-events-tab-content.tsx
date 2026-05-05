import i18n from '@dhis2/d2-i18n'
import { Input } from '@dhis2/ui'
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

export const RepeatedEventsTabContent: FC<RepeatedEventsTabContentProps> = ({
    dimensionId,
}) => {
    const dispatch = useAppDispatch()

    const { mostRecent, oldest } = useAppSelector((state) =>
        getVisUiConfigRepetitionsByDimension(state, dimensionId)
    )

    const parseInput = useCallback((value) => {
        const parsedValue = parseInt(value, 10)
        return parsedValue > 0 ? parsedValue : 0
    }, [])

    const updateRepetitions = useCallback(
        (repetitions: RepetitionsObject) => {
            const { mostRecent: defaultMostRecent, oldest: defaultOldest } =
                DEFAULT_REPETITIONS_OBJECT

            if (
                repetitions.mostRecent === defaultMostRecent &&
                repetitions.oldest === defaultOldest
            ) {
                // Remove repetitions configuration when the selection matches the default
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

    const onMostRecentChange = useCallback(
        (value) => updateRepetitions({ mostRecent: parseInput(value), oldest }),
        [oldest, parseInput, updateRepetitions]
    )

    const onOldestChange = useCallback(
        (value) => updateRepetitions({ mostRecent, oldest: parseInput(value) }),
        [mostRecent, parseInput, updateRepetitions]
    )

    return (
        <div className={classes.repeatedEventsTiles}>
            <label className={classes.repeatedEventsTile}>
                <span className={classes.repeatedEventsInputWrapper}>
                    <Input
                        type="number"
                        dense
                        className={classes.repeatedEventsInput}
                        value={mostRecent.toString()}
                        onChange={({ value }) => onMostRecentChange(value)}
                        min="0"
                        dataTest="most-recent-input"
                    />
                </span>
                <span className={classes.repeatedEventsLabel}>
                    {i18n.t('Most recent events', {
                        nsSeparator: '^^',
                    })}
                </span>
            </label>
            <label className={classes.repeatedEventsTile}>
                <span className={classes.repeatedEventsInputWrapper}>
                    <Input
                        type="number"
                        dense
                        className={classes.repeatedEventsInput}
                        value={oldest.toString()}
                        onChange={({ value }) => onOldestChange(value)}
                        min="0"
                        dataTest="oldest-input"
                    />
                </span>
                <span className={classes.repeatedEventsLabel}>
                    {i18n.t('Oldest events', {
                        nsSeparator: '^^',
                    })}
                </span>
            </label>
        </div>
    )
}
