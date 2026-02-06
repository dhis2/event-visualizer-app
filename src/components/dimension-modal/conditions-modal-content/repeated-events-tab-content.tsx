//import i18n from '@dhis2/d2-i18n'
//import { Input } from '@dhis2/ui'
import { /*useState, useEffect,*/ type FC } from 'react'
//import {
//    getDefaultUiRepetition,
//    PROP_MOST_RECENT,
//    PROP_OLDEST,
//} from '../../../modules/repetition.js'
//import classes from './styles/ConditionsManager.module.css'
//import { useAppDispatch, useAppSelector } from '@hooks'

//const isDefaultRepetition = (repetition) => {
//    const {
//        [PROP_MOST_RECENT]: defaultMostRecent,
//        [PROP_OLDEST]: defaultOldest,
//    } = getDefaultUiRepetition()
//    return (
//        repetition?.[PROP_MOST_RECENT] === defaultMostRecent &&
//        repetition?.[PROP_OLDEST] === defaultOldest
//    )
//}

type RepeatedEventsTabContentProps = {
    dimensionId: string
}

export const RepeatedEventsTabContent: FC<RepeatedEventsTabContentProps> = ({
    dimensionId,
}) => {
    return <div>Placeholder repetition content for {dimensionId}</div>
    //    const dispatch = useAppDispatch()
    //
    //    const sRepetition = useAppSelector((state) =>
    //        getVisUiConfigRepetitionByDimension(state, dimensionId)
    //    )
    //    const [repetition, setRepetition] = useState(
    //        sRepetition && !isDefaultRepetition(isDefaultRepetition)
    //            ? sRepetition
    //            : getDefaultUiRepetition()
    //    )
    //
    //    useEffect(() => {
    //        if (isDefaultRepetition(repetition)) {
    //            dispatch(acRemoveUiRepetition(dimensionId))
    //        } else {
    //            dispatch(acSetUiRepetition({ dimensionId, repetition }))
    //        }
    //    }, [repetition])
    //
    //    const { [PROP_MOST_RECENT]: mostRecent, [PROP_OLDEST]: oldest } = repetition
    //
    //    const parseInput = (value) => {
    //        const parsedValue = parseInt(value, 10)
    //        return parsedValue > 0 ? parsedValue : 0
    //    }
    //
    //    const onMostRecentChange = (value) => {
    //        setRepetition({
    //            [PROP_MOST_RECENT]: parseInput(value),
    //            [PROP_OLDEST]: oldest,
    //        })
    //    }
    //    const onOldestChange = (value) => {
    //        setRepetition({
    //            [PROP_OLDEST]: parseInput(value),
    //            [PROP_MOST_RECENT]: mostRecent,
    //        })
    //    }
    //
    //    return (
    //        <div>
    //            <p className={classes.paragraph}>
    //                {i18n.t(
    //                    'From stages with repeatable events, show values for this data element from:',
    //                    { nsSeparator: '^^' }
    //                )}
    //            </p>
    //            <div>
    //                <div className={classes.repeatableWrapper}>
    //                    <p className={classes.paragraph}>
    //                        {i18n.t('Most recent events:', {
    //                            nsSeparator: '^^',
    //                        })}
    //                    </p>
    //                    <Input
    //                        type="number"
    //                        dense
    //                        className={classes.repeatableInput}
    //                        value={mostRecent.toString()}
    //                        onChange={({ value }) => onMostRecentChange(value)}
    //                        min="0"
    //                        dataTest="most-recent-input"
    //                    />
    //                </div>
    //                <div className={classes.repeatableWrapper}>
    //                    <p className={classes.paragraph}>
    //                        {i18n.t('Oldest events:', {
    //                            nsSeparator: '^^',
    //                        })}
    //                    </p>
    //                    <Input
    //                        type="number"
    //                        dense
    //                        className={classes.repeatableInput}
    //                        value={oldest.toString()}
    //                        onChange={({ value }) => onOldestChange(value)}
    //                        min="0"
    //                        dataTest="oldest-input"
    //                    />
    //                </div>
    //            </div>
    //        </div>
    //    )
}
