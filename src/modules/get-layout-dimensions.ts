export const INPUT_TYPE_EVENT = 'INPUT_TYPE_EVENT'
export const INPUT_TYPE_ENROLLMENT = 'INPUT_TYPE_ENROLLMENT'
export const INPUT_TYPE_TRACKED_ENTITY = 'INPUT_TYPE_TRACKED_ENTITY'

const DATA_ELEMENT = 'DATA_ELEMENT'
const PERIOD = 'PERIOD'
const ORGANISATION_UNIT = 'ORGANISATION_UNIT'
const STATUS = 'STATUS'

const metadata = {
    lastUpdated: {
        id: 'lastUpdated',
        dimensionType: 'PERIOD',
        name: 'Last updated on',
    },
    createdBy: {
        id: 'createdBy',
        dimensionType: 'USER',
        name: 'Created by',
    },
    lastUpdatedBy: {
        id: 'lastUpdatedBy',
        dimensionType: 'USER',
        name: 'Last updated by',
    },
    created: {
        id: 'created',
        dimensionType: 'PERIOD',
        name: 'Registration date',
    },
    ou: {
        id: 'ou',
        dimensionType: 'ORGANISATION_UNIT',
        name: 'Organisation unit',
    },
    eventStatus: {
        id: 'eventStatus',
        dimensionType: 'STATUS',
        name: 'Event status',
    },
    programStatus: {
        id: 'programStatus',
        dimensionType: 'STATUS',
        name: 'Program status',
    },
    eventDate: {
        id: 'eventDate',
        name: 'Event date',
        dimensionType: 'PERIOD',
    },
    enrollmentDate: {
        id: 'enrollmentDate',
        name: 'Date of enrollment',
        dimensionType: 'PERIOD',
    },
    incidentDate: {
        id: 'incidentDate',
        name: 'Date of birth',
        dimensionType: 'PERIOD',
    },
    scheduledDate: {
        id: 'scheduledDate',
        name: 'Scheduled date',
        dimensionType: 'PERIOD',
    },
    USER_ORGUNIT: {
        name: 'User organisation unit',
    },
    USER_ORGUNIT_CHILDREN: {
        name: 'User sub-units',
    },
    USER_ORGUNIT_GRANDCHILDREN: {
        name: 'User sub-x2-units',
    },
    ACTIVE: {
        name: 'Active',
    },
    CANCELLED: {
        name: 'Cancelled',
    },
    COMPLETED: {
        name: 'Completed',
    },
    SCHEDULE: {
        name: 'Scheduled',
    },
    ImspTQPwCqd: {
        name: 'Sierra Leone',
        displayName: 'Sierra Leone',
        id: 'ImspTQPwCqd',
        path: '/ImspTQPwCqd',
    },
    'A03MvHHogjR.X8zyunlgUfM': {
        id: 'A03MvHHogjR.X8zyunlgUfM',
        name: 'MCH Infant Feeding',
        valueType: 'TEXT',
        optionSet: 'x31y45jvIQL',
        dimensionType: 'DATA_ELEMENT',
        code: 'DE_2006103',
    },
    'ZzYYXq4fJie.X8zyunlgUfM': {
        id: 'ZzYYXq4fJie.X8zyunlgUfM',
        name: 'MCH Infant Feeding',
        valueType: 'TEXT',
        optionSet: 'x31y45jvIQL',
        dimensionType: 'DATA_ELEMENT',
        code: 'DE_2006103',
    },
    cejWyOfXge6: {
        id: 'cejWyOfXge6',
        name: 'Gender',
        valueType: 'TEXT',
        optionSet: 'pC3N9N77UmT',
        dimensionType: 'PROGRAM_ATTRIBUTE',
    },
    Bpx0589u8y0: {
        id: 'Bpx0589u8y0',
        name: 'Facility Ownership',
        dimensionType: 'ORGANISATION_UNIT_GROUP_SET',
    },
    A03MvHHogjR: {
        id: 'A03MvHHogjR',
        repeatable: false,
        name: 'Birth',
    },
    ZzYYXq4fJie: {
        id: 'ZzYYXq4fJie',
        repeatable: false,
        name: 'Baby Postnatal',
    },
    IpHINAT79UW: {
        programType: 'WITH_REGISTRATION',
        displayIncidentDate: true,
        displayEnrollmentDateLabel: 'Date of enrollment',
        displayIncidentDateLabel: 'Date of birth',
        id: 'IpHINAT79UW',
        programStages: [
            {
                id: 'A03MvHHogjR',
                repeatable: false,
                name: 'Birth',
            },
            {
                id: 'ZzYYXq4fJie',
                repeatable: false,
                name: 'Baby Postnatal',
            },
        ],
        name: 'Child Programme',
    },
    X8zyunlgUfM: {
        id: 'X8zyunlgUfM',
        name: 'MCH Infant Feeding',
        dimensionType: 'DATA_ELEMENT',
        code: 'DE_2006103',
    },
    Mnp3oXrpAbK: {
        id: 'Mnp3oXrpAbK',
        name: 'Female',
        code: 'Female',
    },
    rBvjJYbMCVx: {
        id: 'rBvjJYbMCVx',
        name: 'Male',
        code: 'Male',
    },
    x31y45jvIQL: {
        id: 'x31y45jvIQL',
        name: 'MNCH Infant Feeding',
    },
    MAs88nJc9nL: {
        id: 'MAs88nJc9nL',
        name: 'Private Clinic',
        dimensionType: 'ORGANISATION_UNIT_GROUP',
        code: 'Private Clinic',
    },
    fdc6uOvgoji: {
        id: 'fdc6uOvgoji',
        name: 'Bombali',
        dimensionType: 'ORGANISATION_UNIT',
        code: 'OU_193190',
    },
    bS16xfd2E1F: {
        id: 'bS16xfd2E1F',
        name: 'Exclusive',
        code: 'Exclusive',
    },
    odMfnhhpjUj: {
        id: 'odMfnhhpjUj',
        name: 'Mixed',
        code: 'Mixed',
    },
    fLCgjvxrw4c: {
        id: 'fLCgjvxrw4c',
        name: 'Replacement',
        code: 'Replacement',
    },
    pC3N9N77UmT: {
        id: 'pC3N9N77UmT',
        name: 'Gender',
    },
    PVLOW4bCshG: {
        id: 'PVLOW4bCshG',
        name: 'NGO',
        dimensionType: 'ORGANISATION_UNIT_GROUP',
        code: 'NGO',
    },
    oRVt7g429ZO: {
        id: 'oRVt7g429ZO',
        name: 'Public facilities',
        dimensionType: 'ORGANISATION_UNIT_GROUP',
        code: 'Public facilities',
    },
    w0gFTTmsUcF: {
        id: 'w0gFTTmsUcF',
        name: 'Mission',
        dimensionType: 'ORGANISATION_UNIT_GROUP',
        code: 'Mission',
    },
}

const extractDimensionIdParts = (id, inputType) => {
    let rawStageId
    const [dimensionId, part2, part3] = (id || '').split('.').reverse()
    let programId = part3
    if (part3 || inputType !== INPUT_TYPE_TRACKED_ENTITY) {
        rawStageId = part2
    }
    if (inputType === INPUT_TYPE_TRACKED_ENTITY && !part3) {
        programId = part2
    }
    const [programStageId, repetitionIndex] = (rawStageId || '').split('[')
    return {
        dimensionId,
        programStageId,
        ...(programId ? { programId } : {}),
        repetitionIndex:
            repetitionIndex?.length &&
            repetitionIndex.substring(0, repetitionIndex.indexOf(']')),
    }
}

export const getLayoutDimensions = ({ dimensionIds, inputType }) => {
    const dimensions = dimensionIds.map((id) => {
        const { dimensionId, programStageId, programId } =
            extractDimensionIdParts(id, inputType)

        const dimension = {
            ...metadata[id],
            dimensionId,
            programStageId,
            programId,
        }

        if (!dimension.id) {
            dimension.id = id
        }
        return dimension
    })

    if (
        ![INPUT_TYPE_ENROLLMENT, INPUT_TYPE_TRACKED_ENTITY].includes(inputType)
    ) {
        return dimensions
    }

    return dimensions.map((dimension) => {
        if (
            [DATA_ELEMENT, PERIOD].includes(
                dimension.dimensionType || dimension.dimensionItemType
            )
        ) {
            const duplicates = dimensions.filter(
                (d) =>
                    d.dimensionId === dimension.dimensionId &&
                    d !== dimension &&
                    ((dimension.programId && d.programId) ||
                        (dimension.programStageId && d.programStageId))
            )

            if (duplicates.length > 0) {
                const sameProgramId = duplicates.find(
                    (dup) => dup.programId === dimension.programId
                )
                const thirdPartyDuplicates = duplicates
                    .filter((dup) => dup.programId !== dimension.programId)
                    .find((dpid) =>
                        duplicates.find(
                            (dup) =>
                                dup.programStageId !== dpid.programStageId &&
                                dup.programId === dpid.programId
                        )
                    )

                if (sameProgramId || thirdPartyDuplicates) {
                    dimension.suffix = metadata[dimension.programStageId]?.name
                } else {
                    dimension.suffix = metadata[dimension.programId]?.name
                }
            }
        } else if (
            // always suffix ou and statuses for TE
            inputType === INPUT_TYPE_TRACKED_ENTITY &&
            [ORGANISATION_UNIT, STATUS].includes(
                dimension.dimensionType || dimension.dimensionItemType
            ) &&
            dimension.programId
        ) {
            dimension.suffix = metadata[dimension.programId]?.name
        }

        return dimension
    })
}
