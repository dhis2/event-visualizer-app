import { isDimensionMetadataItem } from '@modules/metadata'
import { isObject } from '@modules/validation'
import type { DimensionMetadataItem } from '@types'

export type Transformer = (data: unknown) => {
    dimensions: DimensionMetadataItem[]
    nextPage: number | null
}

export const defaultTransformer: Transformer = (data) => {
    if (!isObject(data) || !('pager' in data) || !('dimensions' in data)) {
        throw new Error('Invalid response data')
    }

    const pager = data.pager
    const dimensions = data.dimensions

    if (
        !isObject(pager) ||
        typeof pager.page !== 'number' ||
        typeof pager.pageCount !== 'number' ||
        typeof pager.pageSize !== 'number' ||
        typeof pager.total !== 'number'
    ) {
        throw new Error('Invalid pager structure')
    }

    if (!Array.isArray(dimensions)) {
        throw new TypeError('Dimensions is not an array')
    }

    if (dimensions.length > 0 && !isDimensionMetadataItem(dimensions[0])) {
        throw new Error('Invalid dimension metadata items')
    }

    const nextPage = pager.page < pager.pageCount ? pager.page + 1 : null
    return { dimensions, nextPage }
}
