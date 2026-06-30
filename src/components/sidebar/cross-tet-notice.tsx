import { NoticeBox } from '@dhis2/ui'
import { useCrossTetMismatch } from '@hooks'
import { getCrossTetMessage } from '@modules/dimension/blocking'
import type { FC } from 'react'

export const CrossTetNotice: FC = () => {
    const mismatch = useCrossTetMismatch()
    if (!mismatch) {
        return null
    }
    return (
        <div data-test="cross-tet-notice">
            <NoticeBox warning dense>
                {getCrossTetMessage(
                    mismatch.dataSourceTetName,
                    mismatch.layoutTetName
                )}
            </NoticeBox>
        </div>
    )
}
