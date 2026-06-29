import { useCrossTetMismatch } from '@components/sidebar/sidebar-disabling'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CrossTetNotice } from '../cross-tet-notice'

vi.mock('@components/sidebar/sidebar-disabling', () => ({
    useCrossTetMismatch: vi.fn(),
    getCrossTetMessage: (dataSourceTetName: string, layoutTetName: string) =>
        `${dataSourceTetName} dimensions cannot be combined with ${layoutTetName} dimensions already in the layout.`,
}))

describe('CrossTetNotice', () => {
    it('renders nothing when there is no cross-TET mismatch', () => {
        vi.mocked(useCrossTetMismatch).mockReturnValue(null)
        const { container } = render(<CrossTetNotice />)
        expect(container.firstChild).toBeNull()
    })

    it('renders a warning notice naming both TETs on a mismatch', () => {
        vi.mocked(useCrossTetMismatch).mockReturnValue({
            dataSourceTetName: 'Person',
            layoutTetName: 'Household',
            layoutTetId: 'tetB',
        })
        render(<CrossTetNotice />)
        expect(
            screen.getByText(
                'Person dimensions cannot be combined with Household dimensions already in the layout.'
            )
        ).toBeTruthy()
    })
})
