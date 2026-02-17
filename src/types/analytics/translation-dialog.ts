import { type FC } from 'react'
import type { SavedVisualization } from '@types'

type TranslationDialogProps = {
    fieldsToTranslate: string[]
    objectToTranslate: SavedVisualization
    onClose: () => void
    onTranslationSaved: () => void
}

export type TranslationDialog = FC<TranslationDialogProps>
