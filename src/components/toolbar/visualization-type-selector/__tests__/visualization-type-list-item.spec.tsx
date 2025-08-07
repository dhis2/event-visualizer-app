import { render } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'
import { VisualizationTypeListItem } from '../visualization-type-list-item'

test('VisualizationTypeListItem renders Line list item', () => {
    const props = {
        iconType: 'LINE_LIST',
        label: 'Line list',
        description: 'A visualization that displays data in a line list format',
        disabled: false,
        isSelected: false,
        onClick: vi.fn(),
    } as const

    const { container } = render(<VisualizationTypeListItem {...props} />)
    expect(container).toMatchSnapshot()
})
