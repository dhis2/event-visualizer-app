import i18n from '@dhis2/d2-i18n'
import { colors } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/start-screen.module.css'
import { dataStatisticsApi } from '@api/data-statistics-api'
import { VisTypeIcon } from '@dhis2/analytics'
import { useAppDispatch } from '@hooks'
import { setNavigationState } from '@store/navigation-slice.js'

export const StartScreen: FC = () => {
    const dispatch = useAppDispatch()

    const { data } = dataStatisticsApi.useGetMostViewedQuery(undefined, {
        // Force fetch at every render in order to have an updated list whenever File -> New is clicked
        refetchOnMountOrArgChange: true,
    })

    return (
        <div className={classes.outer}>
            <div className={classes.inner}>
                <div>
                    <div className={classes.section}>
                        <h3 className={classes.title}>
                            {i18n.t('Getting started')}
                        </h3>
                        <ul className={classes.guide}>
                            <li className={classes.guideItem}>
                                {i18n.t(
                                    'All dimensions that you can use to build visualizations are shown in the sections in the left sidebar.'
                                )}
                            </li>
                            <li className={classes.guideItem}>
                                {i18n.t('Add dimensions to the layout above.')}
                            </li>
                            <li className={classes.guideItem}>
                                {i18n.t(
                                    'Click a dimension to add or remove conditions.'
                                )}
                            </li>
                        </ul>
                    </div>
                    {Boolean(data?.length) && (
                        <div className={classes.section}>
                            <h3 className={classes.title}>
                                {i18n.t(
                                    'Your most viewed event visualizations'
                                )}
                            </h3>
                            {data?.map((vis) => (
                                <p
                                    key={vis.id}
                                    className={classes.visualization}
                                    onClick={() =>
                                        dispatch(
                                            setNavigationState({
                                                visualizationId: vis.id,
                                            })
                                        )
                                    }
                                    data-test={
                                        'start-screen-most-viewed-list-item'
                                    }
                                >
                                    <span className={classes.visIcon}>
                                        <VisTypeIcon
                                            type={vis.type}
                                            useSmall
                                            color={colors.grey600}
                                        />
                                    </span>
                                    <span>{vis.name}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
