import { render, screen } from '@testing-library/react'
import type { DataSourceProgramWithRegistration } from '@types'
import { describe, it, expect, vi } from 'vitest'
import { CardsProgramWithRegistration } from '../cards-program-with-registration'

vi.mock('../card-tracked-entity-type', () => ({
    CardTrackedEntityType: () => (
        <div data-test="card">Tracked entity registration</div>
    ),
}))

vi.mock('../card-enrollment', () => ({
    CardEnrollment: () => <div data-test="card">Enrollment data</div>,
}))

vi.mock('../card-event', () => ({
    CardEvent: () => <div data-test="card">Event data</div>,
}))

vi.mock('../card-program-indicators', () => ({
    CardProgramIndicators: () => <div data-test="card">Program indicators</div>,
}))

const program = { id: 'prog1' } as DataSourceProgramWithRegistration

describe('CardsProgramWithRegistration', () => {
    it('renders the cards in order: registration, enrollment, event, program indicators', () => {
        render(<CardsProgramWithRegistration program={program} />)

        const cardTitles = screen
            .getAllByTestId('card')
            .map((card) => card.textContent)

        expect(cardTitles).toEqual([
            'Tracked entity registration',
            'Enrollment data',
            'Event data',
            'Program indicators',
        ])
    })
})
