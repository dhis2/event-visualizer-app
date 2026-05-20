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
        <div className={classes.repetitionsRow}>
            <div className={classes.repetitionCard}>
                <Input
                    type="number"
                    dense
                    className={classes.repetitionInput}
                    value={mostRecent.toString()}
                    onChange={({ value }) => onMostRecentChange(value)}
                    min="0"
                    dataTest="most-recent-input"
                />
                <span className={classes.repetitionLabel}>
                    {i18n.t('Most recent events')}
                </span>
            </div>
            <div className={classes.repetitionCard}>
                <Input
                    type="number"
                    dense
                    className={classes.repetitionInput}
                    value={oldest.toString()}
                    onChange={({ value }) => onOldestChange(value)}
                    min="0"
                    dataTest="oldest-input"
                />
                <span className={classes.repetitionLabel}>
                    {i18n.t('Oldest events')}
                </span>
            </div>
        </div>
    )
}
