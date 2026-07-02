import { useAppSelector, useMetadataStore } from '@hooks'
import { resolveLayoutContext, type LayoutContext } from '@modules/layout'
import { getVisUiConfigLayoutAllDimensionIds } from '@store/vis-ui-config-slice'
import { useMemo } from 'react'

/* The programs, stages and tracked entity type the layout holds. The context is
 * fully determined by the layout's dimension ids: a dimension's binding is
 * fixed by its id, and its metadata is always in the store before its id enters
 * the layout. So this recomputes only when the layout changes, not when
 * unrelated metadata (e.g. names) loads. */
export const useLayoutContext = (): LayoutContext => {
    const dimensionIds = useAppSelector(getVisUiConfigLayoutAllDimensionIds)
    const metadataStore = useMetadataStore()

    return useMemo(
        () => resolveLayoutContext(dimensionIds, metadataStore),
        [dimensionIds, metadataStore]
    )
}
