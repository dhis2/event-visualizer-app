import { describeSavedVisualizations } from '../support/saved-visualizations'

describeSavedVisualizations('enrollment line lists', [
    {
        covers: 'Enrollment line list, one stage with enrollment dimensions',
        id: 'qSc4vbYPPgk',
        name: 'EVER [Line list] [Enrollment] Basic',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Enrollment status',
        ],
    },
    {
        covers: 'Enrollment line list, one stage with enrollment dimensions',
        id: 'C524QgkjodB',
        name: 'EVER [Line list] [Enrollment] Stage and enrollment dimensions',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Enrollment status',
            'Event org. unit',
            'Event status',
        ],
    },
    {
        covers: 'Enrollment line list, several stages of one program',
        id: 'kUbNtOy0T12',
        name: 'E2E: Enrollment line list, several stages',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of enrollment',
            'Date of birth',
            'Enrollment status',
            'Gender',
            'MCH Weight (g) · Birth',
            'MCH ARV at birth · Birth',
            'MCH Infant Weight (g) · Baby Postnatal',
            'Scheduled date · Baby Postnatal',
            'Average weight (g)',
        ],
    },
    {
        covers: 'Enrollment line list, repeated events',
        id: 'XCLdIcUmenR',
        name: 'E2E: Enrollment - Percentage (repeated)',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Enrollment date (e2e)',
            'E2E - Percentage (oldest)',
            'E2E - Percentage (oldest +1)',
            'E2E - Percentage (most recent -1)',
            'E2E - Percentage (most recent)',
        ],
    },
    {
        covers: 'Enrollment line list, repeated events',
        id: 'WrIV7ZoYECj',
        name: 'E2E: Enrollment - Hemoglobin (repeated)',
        type: 'LINE_LIST',
        headers: [
            'Enrollment org. unit',
            'Date of first visit',
            'WHOMCH Hemoglobin value (most recent -2)',
            'WHOMCH Hemoglobin value (most recent -1)',
            'WHOMCH Hemoglobin value (most recent)',
        ],
    },
])
