import { useCallback, type FC } from 'react'
import classes from './styles/dimension-list-item.module.css'
import { useAddMetadata, useAppDispatch } from '@hooks'
import { setUiActiveDimensionModal } from '@store/ui-slice'
import type { DimensionMetadataItem, Program, ProgramStage } from '@types'

type DimensionListItemProps = {
    dimension?: DimensionMetadataItem
    program?: Program
    programStage?: ProgramStage
}

export const DimensionListItem: FC<DimensionListItemProps> = ({
    dimension,
    program,
    programStage,
}) => {
    const dispatch = useAppDispatch()
    const addMetadata = useAddMetadata()
    const onClick = useCallback(() => {
        if (!dimension) {
            console.log('TODO: make dimension required later')
            return
        }
        addMetadata(dimension)
        if (program) {
            addMetadata(program)
        }
        if (programStage) {
            addMetadata(programStage)
        }
        dispatch(setUiActiveDimensionModal(dimension.id))
    }, [addMetadata, dispatch, dimension, program, programStage])
    return (
        <li
            className={classes.item}
            data-test="dimension-list-item"
            onClick={onClick}
        >
            {dimension?.name ?? 'TEMP PLACEHOLDER'}
        </li>
    )
}
