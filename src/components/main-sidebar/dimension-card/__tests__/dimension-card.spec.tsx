import { useAppDispatch, useAppSelector } from '@hooks'
import {
    addDimensionCardCollapsedState,
    removeDimensionCardCollapsedState,
    toggleDimensionCardIsCollapsed,
} from '@store/dimensions-selection-slice'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DimensionCard } from '../dimension-card'

vi.mock('@hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}))

vi.mock('@store/dimensions-selection-slice', () => ({
    addDimensionCardCollapsedState: vi.fn(),
    removeDimensionCardCollapsedState: vi.fn(),
    toggleDimensionCardIsCollapsed: vi.fn(),
    isDimensionCardCollapsed: vi.fn(),
}))

describe('DimensionCard', () => {
    const mockDispatch = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)
        vi.mocked(useAppSelector).mockReturnValue(false)
    })

    it('renders the title and children', () => {
        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div data-test="child">Child content</div>
            </DimensionCard>
        )

        expect(screen.getByText('Metadata')).toBeInTheDocument()
        expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('registers collapsed state on mount and cleans up on unmount', () => {
        const { unmount } = render(
            <DimensionCard dimensionCardKey="enrollment" title="Enrollment">
                <div />
            </DimensionCard>
        )

        expect(mockDispatch).toHaveBeenCalledWith(
            addDimensionCardCollapsedState('enrollment')
        )

        unmount()

        expect(mockDispatch).toHaveBeenCalledWith(
            removeDimensionCardCollapsedState('enrollment')
        )
    })

    it('dispatches toggleDimensionCardIsCollapsed when header is clicked', async () => {
        const user = userEvent.setup()

        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const header = screen.getByTestId('dimension-card-header')
        await user.click(header)

        expect(mockDispatch).toHaveBeenCalledWith(
            toggleDimensionCardIsCollapsed('metadata')
        )
    })

    it('applies collapsed class when isCollapsed is true', () => {
        vi.mocked(useAppSelector).mockReturnValue(true)

        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const content = screen.getByTestId('dimension-card-content')
        expect(content.className).toMatch(/collapsed/)
    })

    it('does not apply collapsed class when isCollapsed is false', () => {
        vi.mocked(useAppSelector).mockReturnValue(false)

        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const content = screen.getByTestId('dimension-card-content')
        expect(content.className).not.toMatch(/collapsed/)
    })

    it('applies isDisabledByFilter class when isDisabledByFilter is true', () => {
        render(
            <DimensionCard
                dimensionCardKey="metadata"
                title="Metadata"
                isDisabledByFilter={true}
            >
                <div />
            </DimensionCard>
        )

        const container = screen.getByTestId('dimension-card')
        expect(container.className).toMatch(/isDisabledByFilter/)
    })

    it('does not apply isDisabledByFilter class by default', () => {
        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const container = screen.getByTestId('dimension-card')
        expect(container.className).not.toMatch(/isDisabledByFilter/)
    })

    it('applies withSubSections class when withSubSections is true', () => {
        render(
            <DimensionCard
                dimensionCardKey="metadata"
                title="Metadata"
                withSubSections
            >
                <div />
            </DimensionCard>
        )

        const content = screen.getByTestId('dimension-card-content')
        expect(content.className).toMatch(/withSubSections/)
    })

    it('displays selected count in header when selectedCount > 0', () => {
        render(
            <DimensionCard
                dimensionCardKey="metadata"
                title="Metadata"
                selectedCount={3}
            >
                <div />
            </DimensionCard>
        )

        expect(
            screen.getByTestId('dimension-card-header-count')
        ).toHaveTextContent('3')
    })

    it('does not display selected count when selectedCount is 0', () => {
        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        expect(
            screen.queryByTestId('dimension-card-header-count')
        ).not.toBeInTheDocument()
    })

    it('sets aria-expanded to true when not collapsed', () => {
        vi.mocked(useAppSelector).mockReturnValue(false)

        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const header = screen.getByTestId('dimension-card-header')
        expect(header).toHaveAttribute('aria-expanded', 'true')
    })

    it('sets aria-expanded to false when collapsed', () => {
        vi.mocked(useAppSelector).mockReturnValue(true)

        render(
            <DimensionCard dimensionCardKey="metadata" title="Metadata">
                <div />
            </DimensionCard>
        )

        const header = screen.getByTestId('dimension-card-header')
        expect(header).toHaveAttribute('aria-expanded', 'false')
    })

    it('disables header button when isDisabledByFilter is true', () => {
        render(
            <DimensionCard
                dimensionCardKey="metadata"
                title="Metadata"
                isDisabledByFilter
            >
                <div />
            </DimensionCard>
        )

        const header = screen.getByTestId('dimension-card-header')
        expect(header).toBeDisabled()
    })
})
