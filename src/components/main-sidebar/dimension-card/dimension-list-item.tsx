import { useCallback, type FC, type KeyboardEvent } from 'react'
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
    const handleActivate = useCallback(() => {
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

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLLIElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleActivate()
            }
        },
        [handleActivate]
    )

    return (
        <li
            className={classes.item}
            data-test="dimension-list-item"
            onClick={handleActivate}
            onKeyDown={onKeyDown}
            role="button"
            tabIndex={0}
        >
            {dimension?.name ?? 'TEMP PLACEHOLDER'}
        </li>
    )
}
