import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SidebarEmptyState } from '../sidebar-empty-state'

describe('SidebarEmptyState', () => {
    it('renders the empty state container', () => {
        render(<SidebarEmptyState />)

        expect(screen.getByTestId('sidebar-empty-state')).toBeInTheDocument()
    })

    it('points the user at the data source selector and what will appear', () => {
        render(<SidebarEmptyState />)

        expect(
            screen.getByText(
                'Choose a data source above to see its dimensions, periods, and organisation units.'
            )
        ).toBeInTheDocument()
    })
})
