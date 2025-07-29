import { VIS_TYPE_LINE_LIST } from '@dhis2/analytics'
import { render } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'
import VisualizationTypeListItem from './visualization-type-list-item'

test('VisualizationTypeListItem renders Line list item', () => {
    const props = {
        iconType: VIS_TYPE_LINE_LIST,
        label: 'Line list',
        description: 'A visualization that displays data in a line list format',
        disabled: false,
        isSelected: false,
        onClick: vi.fn(),
    }

    const { container } = render(<VisualizationTypeListItem {...props} />)
    expect(container).toMatchSnapshot()
})
