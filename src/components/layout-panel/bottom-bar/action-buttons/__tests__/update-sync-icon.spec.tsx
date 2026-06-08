import { render, screen, act } from '@testing-library/react'
import { createRef } from 'react'
import { describe, it, expect } from 'vitest'
import classes from '../styles/update-sync-icon.module.css'
import { UpdateSyncIcon } from '../update-sync-icon'
import type { UpdateSyncIconHandle } from '../update-sync-icon'

describe('UpdateSyncIcon', () => {
    it('renders idle by default', () => {
        render(<UpdateSyncIcon />)

        expect(screen.getByTestId('update-sync-icon')).toBeInTheDocument()
        expect(screen.getByTestId('update-sync-icon-spinner')).not.toHaveClass(
            classes.run
        )
    })

    it('starts the animation when play() is called', () => {
        const ref = createRef<UpdateSyncIconHandle>()
        render(<UpdateSyncIcon ref={ref} />)

        act(() => ref.current?.play())

        expect(screen.getByTestId('update-sync-icon-spinner')).toHaveClass(
            classes.run
        )
    })

    it('restarts on each play() by remounting the animated group', () => {
        const ref = createRef<UpdateSyncIconHandle>()
        render(<UpdateSyncIcon ref={ref} />)

        act(() => ref.current?.play())
        const firstRun = screen.getByTestId('update-sync-icon-spinner')

        act(() => ref.current?.play())
        const secondRun = screen.getByTestId('update-sync-icon-spinner')

        expect(secondRun).toHaveClass(classes.run)
        expect(secondRun).not.toBe(firstRun)
    })
})
