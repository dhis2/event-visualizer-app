import {
    IconDimensionData16,
    IconDimensionProgramIndicator16,
    IconDimensionProgramAttribute16,
    IconFilter16,
    IconDimensionCategoryOptionGroupset16,
    IconDimensionOrgUnitGroupset16,
    IconDimensionOrgUnit16,
    IconCalendar16,
} from '@dhis2/ui'
import React, { type ReactNode } from 'react'
import type { DimensionType } from '@types'

type DimensionTypeIconMap = Partial<Record<DimensionType, ReactNode>>

const dimensionTypeIconMap: DimensionTypeIconMap = {
    PROGRAM_DATA_ELEMENT: <IconDimensionData16 />,
    PROGRAM_INDICATOR: <IconDimensionProgramIndicator16 />,
    PROGRAM_ATTRIBUTE: <IconDimensionProgramAttribute16 />,
    CATEGORY_OPTION_GROUP_SET: <IconDimensionCategoryOptionGroupset16 />,
    ORGANISATION_UNIT_GROUP_SET: <IconDimensionOrgUnitGroupset16 />,
    ORGANISATION_UNIT: <IconDimensionOrgUnit16 />,
    CATEGORY: <IconFilter16 />,
    PERIOD: <IconCalendar16 />,
}

interface DimensionTypeIconProps {
    dimensionType: DimensionType
}

// Presentational component used by dnd - do not add redux or dnd functionality

const DimensionTypeIcon: React.FC<DimensionTypeIconProps> = ({
    dimensionType,
}) => dimensionTypeIconMap[dimensionType]

export { DimensionTypeIcon }
