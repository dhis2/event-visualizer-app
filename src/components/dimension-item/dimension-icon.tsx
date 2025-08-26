import {
    IconDimensionData16,
    IconDimensionProgramIndicator16,
    IconDimensionProgramAttribute16,
    IconFilter16,
    IconDimensionCategoryOptionGroupset16,
    IconDimensionOrgUnitGroupset16,
    IconDimensionOrgUnit16,
    IconCheckmarkCircle16,
    IconUser16,
    IconCalendar16,
} from '@dhis2/ui'
import React, { type ReactNode } from 'react'
import type { SupportedDimensionType } from '@constants/dimension-types'

type DimensionIconMap = Record<SupportedDimensionType, ReactNode>

const dimensionIconMap: DimensionIconMap = {
    DATA_ELEMENT: <IconDimensionData16 />,
    PROGRAM_INDICATOR: <IconDimensionProgramIndicator16 />,
    PROGRAM_ATTRIBUTE: <IconDimensionProgramAttribute16 />,
    CATEGORY_OPTION_GROUP_SET: <IconDimensionCategoryOptionGroupset16 />,
    ORGANISATION_UNIT_GROUP_SET: <IconDimensionOrgUnitGroupset16 />,
    ORGANISATION_UNIT: <IconDimensionOrgUnit16 />,
    CATEGORY: <IconFilter16 />,
    PERIOD: <IconCalendar16 />,
    STATUS: <IconCheckmarkCircle16 />,
    USER: <IconUser16 />,
}

interface DimensionIconProps {
    dimensionType: SupportedDimensionType
}

// Presentational component used by dnd - do not add redux or dnd functionality

const DimensionIcon: React.FC<DimensionIconProps> = ({ dimensionType }) => {
    return dimensionIconMap[dimensionType]
}

export { DimensionIcon }
