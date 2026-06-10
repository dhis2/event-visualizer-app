import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import classes from '../styles/update-sync-icon.module.css'
import { UpdateSyncIcon } from '../update-sync-icon'

describe('UpdateSyncIcon', () => {
    it('renders idle when not animating', () => {
        render(<UpdateSyncIcon isAnimating={false} />)

        expect(screen.getByTestId('update-sync-icon')).toBeInTheDocument()
        expect(screen.getByTestId('update-sync-icon-spinner')).not.toHaveClass(
            classes.run
        )
    })

    it('applies the run class when animating', () => {
        render(<UpdateSyncIcon isAnimating={true} />)

        expect(screen.getByTestId('update-sync-icon-spinner')).toHaveClass(
            classes.run
        )
    })
})
