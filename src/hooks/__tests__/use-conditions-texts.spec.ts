import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConditionsTexts } from '../use-conditions-texts'
import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider/metadata-provider'
import type { LayoutDimension } from '@components/layout-panel/chip'
import { useAddMetadata } from '@hooks'

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

const {
    mockParseConditionsStringToArray,
    mockShouldUseLegendSetConditions,
    mockShouldUseOrgUnitConditions,
    mockShouldUseOptionSetConditions,
    mockShouldUseBooleanConditions,
    mockGetLegendSetConditionMetadataIds,
    mockGetOptionSetIdAndSelectedOptionCodes,
    mockGetBooleanConditionTexts,
    mockGetOrgUnitConditionMetadataIds,
    mockGetOperatorConditionTexts,
} = vi.hoisted(() => ({
    mockParseConditionsStringToArray: vi.fn(),
    mockShouldUseLegendSetConditions: vi.fn(),
    mockShouldUseOrgUnitConditions: vi.fn(),
    mockShouldUseOptionSetConditions: vi.fn(),
    mockShouldUseBooleanConditions: vi.fn(),
    mockGetLegendSetConditionMetadataIds: vi.fn(),
    mockGetOptionSetIdAndSelectedOptionCodes: vi.fn(),
    mockGetBooleanConditionTexts: vi.fn(),
    mockGetOrgUnitConditionMetadataIds: vi.fn(),
    mockGetOperatorConditionTexts: vi.fn(),
}))

vi.mock('@modules/conditions', () => ({
    parseConditionsStringToArray: mockParseConditionsStringToArray,
    shouldUseLegendSetConditions: mockShouldUseLegendSetConditions,
    shouldUseOrgUnitConditions: mockShouldUseOrgUnitConditions,
    shouldUseOptionSetConditions: mockShouldUseOptionSetConditions,
    shouldUseBooleanConditions: mockShouldUseBooleanConditions,
    getLegendSetConditionMetadataIds: mockGetLegendSetConditionMetadataIds,
    getOptionSetIdAndSelectedOptionCodes:
        mockGetOptionSetIdAndSelectedOptionCodes,
    getBooleanConditionTexts: mockGetBooleanConditionTexts,
    getOrgUnitConditionMetadataIds: mockGetOrgUnitConditionMetadataIds,
    getOperatorConditionTexts: mockGetOperatorConditionTexts,
}))

type WrapperProps = { children: ReactNode }
const DefaultWrapper = ({ children }: WrapperProps) =>
    createElement(MockMetadataProvider, undefined, children)

const baseDimension: LayoutDimension = {
    id: 'dimId',
    dimensionId: 'dimId',
    name: 'Test dimension',
}

const setupDefaultMocks = () => {
    mockParseConditionsStringToArray.mockImplementation((value) => {
        if (Array.isArray(value)) {
            return value
        }
        if (typeof value === 'string' && value.length > 0) {
            return value.split(',')
        }
        return []
    })
    mockShouldUseLegendSetConditions.mockReturnValue(false)
    mockShouldUseOrgUnitConditions.mockReturnValue(false)
    mockShouldUseOptionSetConditions.mockReturnValue(false)
    mockShouldUseBooleanConditions.mockReturnValue(false)
    mockGetLegendSetConditionMetadataIds.mockReturnValue([])
    mockGetOptionSetIdAndSelectedOptionCodes.mockReturnValue({
        optionSetId: '',
        selectedOptionCodes: [],
    })
    mockGetBooleanConditionTexts.mockReturnValue([])
    mockGetOrgUnitConditionMetadataIds.mockReturnValue([])
    mockGetOperatorConditionTexts.mockReturnValue([])
}

beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
})

describe('useConditionsTexts metadata updates', () => {
    it('replaces legend set ids with metadata names as they arrive', () => {
        mockShouldUseLegendSetConditions.mockReturnValue(true)
        const legendIds = ['LEGEND_A', 'LEGEND_B']
        mockGetLegendSetConditionMetadataIds.mockReturnValue(legendIds)

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'gt:10' },
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

    it('updates option set condition texts once the option set metadata becomes available', () => {
        mockShouldUseOptionSetConditions.mockReturnValue(true)
        const optionSetId = 'OS_123'
        const selectedOptionCodes = ['A', 'B']
        mockGetOptionSetIdAndSelectedOptionCodes.mockReturnValue({
            optionSetId,
            selectedOptionCodes,
        })

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'in:A;B' },
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

        expect(result.current.texts).toEqual(['Alpha'])

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
        mockShouldUseOrgUnitConditions.mockReturnValue(true)
        const prefixedOrgUnitIds = ['LEVEL-OU_A', 'LEVEL-OU_B']
        const unprefixedOrgUnitIds = ['OU_A', 'OU_B']
        mockGetOrgUnitConditionMetadataIds.mockImplementation(
            (_, includeUnprefixed = false) =>
                includeUnprefixed
                    ? [...prefixedOrgUnitIds, ...unprefixedOrgUnitIds]
                    : prefixedOrgUnitIds
        )

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'in:LEVEL-OU_A;LEVEL-OU_B' },
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
        mockShouldUseOrgUnitConditions.mockReturnValue(true)
        const prefixedOrgUnitIds = ['LEVEL-OU_A', 'LEVEL-OU_B']
        mockGetOrgUnitConditionMetadataIds.mockImplementation(
            (_, includeUnprefixed = false) =>
                includeUnprefixed
                    ? [...prefixedOrgUnitIds, 'OU_B']
                    : prefixedOrgUnitIds
        )

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'in:LEVEL-OU_A;LEVEL-OU_B' },
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
        mockShouldUseOptionSetConditions.mockReturnValue(true)
        const optionSetId = 'OS_EXTRA'
        const selectedOptionCodes = ['A', 'B']
        mockGetOptionSetIdAndSelectedOptionCodes.mockReturnValue({
            optionSetId,
            selectedOptionCodes,
        })

        const { result } = renderHook(
            () => {
                const texts = useConditionsTexts({
                    conditions: { condition: 'in:A;B' },
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
})
