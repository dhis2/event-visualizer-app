import React from 'react'
import { Chip } from '../chip'
import type { LayoutDimension } from '../chip'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

// Chip background colors
const CHIP_NORMAL_COLOR = 'rgb(224, 242, 241)' // teal-100 normal state
const CHIP_HOVER_COLOR = 'rgb(205, 234, 232)' // teal-100 hover state
const CHIP_GREY_COLOR = 'rgb(248, 249, 250)' // grey-100 for inactive chips

const createMockOptions = (
    preloadedState = {},
    metadata = {}
): MockOptions => ({
    partialStore: {
        reducer: {
            visUiConfig: visUiConfigSlice.reducer,
        },
        preloadedState: {
            visUiConfig: { ...visUiConfigInitialState, ...preloadedState },
        },
    },
    metadata,
})

const assertTooltipContent = (expectedTexts: string[]) => {
    const tooltipSelector = '[role="tooltip"]'
    cy.getByDataTest('layout-dimension-chip').realHover()
    cy.get(tooltipSelector).should('be.visible')

    expectedTexts.forEach((text) => {
        cy.get(tooltipSelector).should('contain.text', text)
    })

    cy.get('body').realHover({ position: 'bottomLeft' })
    cy.get(tooltipSelector).should('not.exist')
    cy.getByDataTest('layout-dimension-chip').should(
        'not.have.css',
        'background-color',
        CHIP_HOVER_COLOR
    )
}

describe('<Chip />', () => {
    it('renders an org unit chip in columns with 2 org units set', () => {
        const ou1Name = 'District Hospital'
        const ou2Name = 'Regional Clinic'

        const dimension: LayoutDimension = {
            id: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: 'Organisation unit',
            dimensionId: 'ou',
            programStageId: '',
        }

        const orgUnitMetadata = {
            ou1: {
                uid: 'ou1',
                name: ou1Name,
            },
            ou2: {
                uid: 'ou2',
                name: ou2Name,
            },
        }

        const appWrapperProps = createMockOptions(
            {
                itemsByDimension: {
                    [dimension.id]: ['ou1', 'ou2'],
                },
                conditionsByDimension: {},
            },
            orgUnitMetadata
        )

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('Organisation unit').should('be.visible')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', '2')
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_NORMAL_COLOR
        )
        assertTooltipContent([ou1Name, ou2Name])
    })

    it('shows hover color when hovered and returns to normal color when unhovered', () => {
        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: { programStatus: ['ACTIVE'] },
            conditionsByDimension: {},
        })

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_NORMAL_COLOR
        )

        cy.getByDataTest('layout-dimension-chip').realHover()
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_HOVER_COLOR
        )

        cy.get('body').realHover({ position: 'bottomLeft' })
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_NORMAL_COLOR
        )
    })

    it('renders a data element chip in columns that has a suffix and no items or conditions', () => {
        const dimension: LayoutDimension = {
            id: 'ZzYYXq4fJie.X8zyunlgUfM',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
            optionSet: 'x31y45jvIQL',
            dimensionId: 'X8zyunlgUfM',
            programStageId: 'ZzYYXq4fJie',
            suffix: 'Baby Postnatal',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: {},
            conditionsByDimension: {},
        })

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('MCH Infant Feeding,').should('be.visible')
        cy.contains('Baby Postnatal').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', 'all')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        assertTooltipContent(['Showing all values for this dimension'])
    })

    it('renders a chip in columns that has a suffix and has conditions', () => {
        const mixedFeedingName = 'Mixed feeding'
        const exclusiveBreastfeedingName = 'Exclusive breastfeeding'

        const dimension: LayoutDimension = {
            id: 'ZzYYXq4fJie.X8zyunlgUfM',
            name: 'MCH Infant Feeding',
            dimensionType: 'DATA_ELEMENT',
            valueType: 'TEXT',
            optionSet: 'x31y45jvIQL',
            dimensionId: 'X8zyunlgUfM',
            programStageId: 'ZzYYXq4fJie',
            suffix: 'Baby Postnatal',
        }

        const mockMetadata = {
            x31y45jvIQL: {
                id: 'x31y45jvIQL',
                name: 'Feeding type',
                valueType: 'TEXT' as const,
                version: 1,
                options: [
                    { id: 'mixed-id', code: 'Mixed', name: mixedFeedingName },
                    {
                        id: 'exclusive-id',
                        code: 'Exclusive',
                        name: exclusiveBreastfeedingName,
                    },
                ],
            },
        }

        const appWrapperProps = createMockOptions(
            {
                itemsByDimension: {},
                conditionsByDimension: {
                    'ZzYYXq4fJie.X8zyunlgUfM': {
                        condition: 'IN:Mixed;Exclusive',
                    },
                },
            },
            mockMetadata
        )

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('MCH Infant Feeding,').should('be.visible')
        cy.contains('Baby Postnatal').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', '2')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        assertTooltipContent([mixedFeedingName, exclusiveBreastfeedingName])
    })

    it('renders a chip in columns that has items', () => {
        const activeStatus = 'ACTIVE'
        const completedStatus = 'COMPLETED'

        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: {
                programStatus: [activeStatus, completedStatus],
            },
            conditionsByDimension: {},
        })

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="columns" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('Program status').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', '2')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        assertTooltipContent([activeStatus, completedStatus])
    })

    it('renders a chip in filters with no suffix and no items or conditions', () => {
        const dimension: LayoutDimension = {
            id: 'cejWyOfXge6',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
            optionSet: 'pC3N9N77UmT',
            dimensionId: 'cejWyOfXge6',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: {},
            conditionsByDimension: {},
        })

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="filters" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('Gender').should('be.visible')
        cy.get('[data-test="layout-dimension-chip"]').should('not.contain', ',')
        cy.getByDataTest('chip-items').should('not.be.visible')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_GREY_COLOR
        )
        assertTooltipContent(['None selected'])
    })

    it('renders a chip in filters that has items', () => {
        const activeStatus = 'ACTIVE'
        const completedStatus = 'COMPLETED'

        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: {
                programStatus: [activeStatus, completedStatus],
            },
            conditionsByDimension: {},
        })

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="filters" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('Program status').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', '2')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_NORMAL_COLOR
        )
        assertTooltipContent([activeStatus, completedStatus])
    })

    it('renders a chip in filters with condition counts', () => {
        const maleName = 'Male'
        const femaleName = 'Female'

        const dimension: LayoutDimension = {
            id: 'cejWyOfXge6',
            name: 'Gender',
            dimensionType: 'PROGRAM_ATTRIBUTE',
            valueType: 'TEXT',
            optionSet: 'pC3N9N77UmT',
            dimensionId: 'cejWyOfXge6',
            programStageId: '',
        }

        const genderMetadata = {
            pC3N9N77UmT: {
                id: 'pC3N9N77UmT',
                name: 'Gender',
                valueType: 'TEXT' as const,
                version: 1,
                options: [
                    { id: 'male-id', code: 'male', name: maleName },
                    { id: 'female-id', code: 'female', name: femaleName },
                ],
            },
        }

        const appWrapperProps = createMockOptions(
            {
                itemsByDimension: {},
                conditionsByDimension: {
                    [dimension.id]: { condition: 'IN:male' },
                },
            },
            genderMetadata
        )

        cy.mount(
            <MockAppWrapper {...appWrapperProps}>
                <Chip dimension={dimension} axisId="filters" />
            </MockAppWrapper>
        )

        cy.getByDataTest('layout-dimension-chip').should('be.visible')
        cy.contains('Gender').should('be.visible')
        cy.getByDataTest('chip-menu-button').should('be.visible')
        cy.getByDataTest('chip-items').should('contain.text', '1')
        cy.getByDataTest('layout-dimension-chip').should(
            'have.css',
            'background-color',
            CHIP_NORMAL_COLOR
        )
        assertTooltipContent([maleName])
    })
})
