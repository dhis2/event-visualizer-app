import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider/metadata-provider'
import type { LayoutDimension } from '@components/layout-panel/axis/chip'
import { useAddMetadata } from '@hooks'
import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useConditionsTexts } from '../use-conditions-texts'

const mockRootOrgUnits = [
    {
        id: 'ROOT',
        name: 'Root org unit',
        displayName: 'Root org unit',
        path: '/ROOT',
    },
]

vi.mock('@hooks', async () => ({
    ...(await vi.importActual('@hooks')),
    useRootOrgUnits: () => mockRootOrgUnits,
}))

type WrapperProps = { children: ReactNode }
const DefaultWrapper = ({ children }: WrapperProps) =>
    createElement(MockMetadataProvider, undefined, children)

const baseDimension: LayoutDimension = {
    id: 'dimId',
    dimensionId: 'dimId',
    dimensionType: 'DATA_ELEMENT',
    name: 'Test dimension',
}

describe('useConditionsTexts metadata updates', () => {
    it('replaces legend set ids with metadata names as they arrive', () => {
        const legendIds = ['LEGEND_A', 'LEGEND_B']

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: {
                        condition: 'IN:LEGEND_A;LEGEND_B',
                        legendSet: 'LEGEND_SET',
                    },
                    dimension: baseDimension,
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(legendIds)

        act(() => {
            result.current.addMetadata({
                uid: 'LEGEND_A',
                name: 'Legend Alpha',
            })
        })

        expect(result.current.texts).toEqual(['Legend Alpha', 'LEGEND_B'])

        act(() => {
            result.current.addMetadata({
                uid: 'LEGEND_B',
                name: 'Legend Beta',
            })
        })

        expect(result.current.texts).toEqual(['Legend Alpha', 'Legend Beta'])
    })

    it('names option set condition texts as their metadata arrives, falling back to the code', () => {
        const optionSetId = 'OS_123'
        const selectedOptionCodes = ['A', 'B']

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'IN:A;B' },
                    dimension: { ...baseDimension, optionSet: optionSetId },
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(selectedOptionCodes)

        act(() => {
            result.current.addMetadata({
                id: optionSetId,
                name: 'Status',
                options: [{ code: 'A', name: 'Alpha' }],
            })
        })

        expect(result.current.texts).toEqual(['Alpha', 'B'])

        act(() => {
            result.current.addMetadata({
                id: optionSetId,
                name: 'Status',
                options: [
                    { code: 'A', name: 'Alpha' },
                    { code: 'B', name: 'Beta' },
                ],
            })
        })

        expect(result.current.texts).toEqual(['Alpha', 'Beta'])
    })

    it('prefers progressively richer organisation unit metadata as it arrives', () => {
        const prefixedOrgUnitIds = ['LEVEL-OU_A', 'LEVEL-OU_B']

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'IN:LEVEL-OU_A;LEVEL-OU_B' },
                    dimension: {
                        ...baseDimension,
                        valueType: 'ORGANISATION_UNIT',
                    },
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(prefixedOrgUnitIds)

        act(() => {
            result.current.addMetadata({
                uid: 'OU_A',
                name: 'Org Unit A',
            })
            result.current.addMetadata({
                uid: 'OU_B',
                name: 'Org Unit B',
            })
        })

        expect(result.current.texts).toEqual(['Org Unit A', 'Org Unit B'])

        act(() => {
            result.current.addMetadata({
                uid: 'LEVEL-OU_A',
                name: 'Pref Org Unit A',
            })
            result.current.addMetadata({
                uid: 'LEVEL-OU_B',
                name: 'Pref Org Unit B',
            })
        })

        expect(result.current.texts).toEqual([
            'Pref Org Unit A',
            'Pref Org Unit B',
        ])
    })

    it('mixes available org unit metadata on a per-id basis', () => {
        const prefixedOrgUnitIds = ['LEVEL-OU_A', 'LEVEL-OU_B']

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'IN:LEVEL-OU_A;LEVEL-OU_B' },
                    dimension: {
                        ...baseDimension,
                        valueType: 'ORGANISATION_UNIT',
                    },
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(prefixedOrgUnitIds)

        act(() => {
            result.current.addMetadata({
                uid: 'LEVEL-OU_A',
                name: 'Pref Org Unit A',
            })
            result.current.addMetadata({
                uid: 'OU_B',
                name: 'Org Unit B',
            })
        })

        expect(result.current.texts).toEqual(['Pref Org Unit A', 'Org Unit B'])
    })

    it('only returns option texts for selected option codes', () => {
        const optionSetId = 'OS_EXTRA'
        const selectedOptionCodes = ['A', 'B']

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'IN:A;B' },
                    dimension: { ...baseDimension, optionSet: optionSetId },
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(selectedOptionCodes)

        act(() => {
            result.current.addMetadata({
                id: optionSetId,
                name: 'Status',
                options: [
                    { code: 'A', name: 'Alpha' },
                    { code: 'B', name: 'Beta' },
                    { code: 'C', name: 'Gamma' },
                ],
            })
        })

        expect(result.current.texts).toEqual(['Alpha', 'Beta'])
    })

    it('keeps the selected order and names the no-value option without metadata', () => {
        const optionSetId = 'OS_ORDER'

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'IN:B;D2__NOVALUE;A' },
                    dimension: { ...baseDimension, optionSet: optionSetId },
                    formatValueOptions: {},
                })
                const addMetadata = useAddMetadata()
                return { texts, addMetadata }
            },
            { wrapper: DefaultWrapper }
        )

        expect(result.current.texts).toEqual(['B', 'No value', 'A'])

        act(() => {
            result.current.addMetadata({
                id: optionSetId,
                name: 'Status',
                options: [
                    { code: 'A', name: 'Alpha' },
                    { code: 'B', name: 'Beta' },
                ],
            })
        })

        expect(result.current.texts).toEqual(['Beta', 'No value', 'Alpha'])
    })
})
