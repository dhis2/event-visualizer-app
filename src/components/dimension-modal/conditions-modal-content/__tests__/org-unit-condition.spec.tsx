import organisationUnitsData from '@test-utils/__fixtures__/organisation-units.json'
import { renderWithAppWrapper } from '@test-utils/app-wrapper'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { OrgUnitCondition } from '../org-unit-condition'

const [rootOrgUnit] = organisationUnitsData.organisationUnits

const StatefulOrgUnitCondition = () => {
    const [condition, setCondition] = useState('')
    return <OrgUnitCondition condition={condition} onChange={setCondition} />
}

const renderOrgUnitCondition = () =>
    renderWithAppWrapper(<StatefulOrgUnitCondition />, {
        queryData: {
            organisationUnits: async (_type, query) =>
                query.id
                    ? { ...rootOrgUnit, children: 0 }
                    : organisationUnitsData,
            organisationUnitGroups: {
                organisationUnitGroups: [
                    {
                        id: 'GROUP_ID',
                        name: 'Hospital',
                        displayName: 'Hospital',
                    },
                ],
            },
        },
    })

describe('OrgUnitCondition', () => {
    it.each([
        { select: 'Select a level', option: 'Facility' },
        { select: 'Select a group', option: 'Hospital' },
    ])('checks $option when picked from $select', async (pick) => {
        await renderOrgUnitCondition()

        await userEvent.click(await screen.findByText(pick.select))
        await userEvent.click(
            await screen.findByRole('checkbox', { name: pick.option })
        )

        expect(
            screen.getByRole('checkbox', { name: pick.option })
        ).toBeChecked()
    })
})
