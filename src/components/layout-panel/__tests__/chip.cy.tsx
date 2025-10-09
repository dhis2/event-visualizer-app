import React from 'react'
import { Chip } from '../chip'
import type { LayoutDimension } from '../chip'
import {
    visUiConfigSlice,
    initialState as visUiConfigInitialState,
} from '@store/vis-ui-config-slice'
import { MockAppWrapper, type MockOptions } from '@test-utils/app-wrapper'

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

describe('<Chip />', () => {
    it('renders an org unit chip in columns with 2 org units set', () => {
        const dimension: LayoutDimension = {
            id: 'ou',
            dimensionType: 'ORGANISATION_UNIT',
            name: 'Organisation unit',
            dimensionId: 'ou',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: {
                [dimension.id]: ['ou1', 'ou2'],
            },
            conditionsByDimension: {},
        })

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
            'rgb(224, 242, 241)' // teal-100
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
    })

    it('renders a chip in columns that has a suffix and has conditions', () => {
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
                    { id: 'mixed-id', code: 'Mixed', name: 'Mixed feeding' },
                    {
                        id: 'exclusive-id',
                        code: 'Exclusive',
                        name: 'Exclusive breastfeeding',
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
    })

    it('renders a chip in columns that has items', () => {
        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: { programStatus: ['ACTIVE', 'COMPLETED'] },
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
            'rgb(248, 249, 250)' // grey-100
        )
    })

    it('renders a chip in filters that has items', () => {
        const dimension: LayoutDimension = {
            id: 'programStatus',
            dimensionType: 'STATUS',
            name: 'Program status',
            dimensionId: 'programStatus',
            programStageId: '',
        }

        const appWrapperProps = createMockOptions({
            itemsByDimension: { programStatus: ['ACTIVE', 'COMPLETED'] },
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
            'rgb(224, 242, 241)' // teal-100
        )
    })

    it('renders a chip in filters with condition counts', () => {
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
                    { id: 'male-id', code: 'male', name: 'Male' },
                    { id: 'female-id', code: 'female', name: 'Female' },
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
            'rgb(224, 242, 241)' // teal-100
        )
    })
})
