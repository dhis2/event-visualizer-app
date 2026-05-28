import i18n from '@dhis2/d2-i18n'
import { NoticeBox } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/stage-notice.module.css'

type StageNoticeProps = {
    filteredByStageName: string | undefined
    customValueStageMismatch: boolean
    customValueDataElementName?: string
}

export const StageNotice: FC<StageNoticeProps> = ({
    filteredByStageName,
    customValueStageMismatch,
    customValueDataElementName,
}) => {
    if (!filteredByStageName) {
        return null
    }

    return (
        <div className={classes.stageNotice}>
            {customValueStageMismatch ? (
                <NoticeBox warning dense>
                    {i18n.t(
                        '"{{- dataElementName}}" is from a different stage than the dimensions in the layout. Choose a data element from stage "{{- stageName}}".',
                        {
                            dataElementName: customValueDataElementName ?? '',
                            stageName: filteredByStageName,
                        }
                    )}
                </NoticeBox>
            ) : (
                <NoticeBox
                    dense
                    title={i18n.t(
                        'Showing data elements from "{{- stageName}}", the stage used in the layout',
                        { stageName: filteredByStageName }
                    )}
                />
            )}
        </div>
    )
}
