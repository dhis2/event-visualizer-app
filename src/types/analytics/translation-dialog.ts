import type { SavedVisualization } from '@types'
import { type FC } from 'react'

type TranslationDialogProps = {
    fieldsToTranslate: string[]
    objectToTranslate: SavedVisualization
    onClose: () => void
    onTranslationSaved: () => void
}

export type TranslationDialog = FC<TranslationDialogProps>
