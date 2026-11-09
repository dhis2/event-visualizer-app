import { describeSavedVisualizations } from '../support/saved-visualizations'

describeSavedVisualizations('tracked entity line lists', [
    {
        covers: 'Tracked entity line list, tracked entity type only',
        id: 'cRuVDbe3Lga',
        name: 'IDV [Line list] [TE] Basic',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'Created on', 'Gender'],
    },
    {
        covers: 'Tracked entity line list, tracked entity type only',
        id: 'qTd4CrFQ4hz',
        name: 'IDV Person List',
        type: 'LINE_LIST',
        headers: ['Registration org. unit', 'First name'],
    },
    {
        covers: 'Tracked entity line list, tracked entity type and one program',
        id: 'cHhlOdJqqox',
        name: 'IDV Person List - LL breaking',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'First name',
            'Enrollment org. unit',
        ],
    },
    {
        covers: 'Tracked entity line list, tracked entity type and one program',
        id: 'GOIpY8GFUJp',
        name: 'IDV [Line list] [TE] Stage and enrollment dimension',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'Enrollment org. unit',
            'Date of enrollment',
            'MCH Apgar Score',
        ],
    },
    {
        covers: 'Tracked entity line list, two programs',
        id: 'IS74uKRvJvl',
        name: 'E2E: Tracked entity line list, two programs',
        type: 'LINE_LIST',
        headers: [
            'Registration org. unit',
            'First name',
            'Last name',
            'E2E TE P1 enrollment date · E2E TE program 1',
            'E2E TE - DE 1 (cross program) · E2E TE P1 stage 1',
            'E2E TE - DE 1 (cross program) · E2E TE P2 stage 1',
            'Created on',
        ],
    },
])
