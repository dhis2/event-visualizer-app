import { MockMetadataProvider } from '@components/app-wrapper/metadata-provider/metadata-provider'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { OrgUnit } from '@types'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OrgUnitCondition } from '../org-unit-condition'

const pickedItems = [
    { id: 'CHILD_OU', name: 'Child org unit', path: '/ROOT/CHILD_OU' },
    { id: 'OU_GROUP-GROUP_ID', name: 'Hospital' },
    { id: 'LEVEL-LEVEL_ID', name: 'Facility' },
]

vi.mock('@hooks', async () => ({
    ...(await vi.importActual('@hooks')),
    useCurrentUser: () => ({ settings: { displayNameProperty: 'name' } }),
    useRootOrgUnits: () => [{ id: 'ROOT', name: 'Root', path: '/ROOT' }],
}))

vi.mock('@dhis2/analytics', async () => ({
    ...(await vi.importActual('@dhis2/analytics')),
    OrgUnitDimension: ({
        selected,
        onSelect,
    }: {
        selected: OrgUnit[]
        onSelect: (args: { items: OrgUnit[] }) => void
    }) => (
        <>
            <ul>
                {selected.map((item) => (
                    <li key={item.id}>{item.id}</li>
                ))}
            </ul>
            <button onClick={() => onSelect({ items: pickedItems })}>
                pick
            </button>
        </>
    ),
}))

const StatefulOrgUnitCondition = () => {
    const [condition, setCondition] = useState('')
    return <OrgUnitCondition condition={condition} onChange={setCondition} />
}

describe('OrgUnitCondition', () => {
    it('shows picked org units, groups and levels as selected', async () => {
        render(
            <MockMetadataProvider>
                <StatefulOrgUnitCondition />
            </MockMetadataProvider>
        )

        await userEvent.click(screen.getByRole('button', { name: 'pick' }))

        const selectedIds = screen
            .getAllByRole('listitem')
            .map((item) => item.textContent)
        expect(selectedIds).toEqual([
            'CHILD_OU',
            'OU_GROUP-GROUP_ID',
            'LEVEL-LEVEL_ID',
        ])
    })
})
