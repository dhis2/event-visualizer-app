import { describeSavedVisualizations } from '../support/saved-visualizations'

describeSavedVisualizations('event line lists', [
    {
        covers: 'Event line list, event program',
        id: 't6SxiQdVPVs',
        name: 'E2E: Event line list, event program',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Report date',
            'Gender',
            'Age in years',
            'Weight in kg',
            'Mode of Discharge',
            'Inpatient bed days average',
            'Last updated on',
        ],
    },
    {
        covers: 'Event line list, one stage of a tracker program',
        id: 'IZJmG9NHTtj',
        name: 'IDV [Line list] [Event] Basic',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'Report date',
            'Event status',
            'MCH Apgar Score',
        ],
    },
    {
        covers: 'Event line list, tracker stage with enrollment dimensions and attributes',
        id: 'C1XaMuNaeDy',
        name: 'Test option set options labels',
        type: 'LINE_LIST',
        headers: [
            'Event org. unit',
            'First name',
            'Last name',
            'WHOMCH Clinical impression of pre-eclampsia',
            'WHOMCH Confirmed or suspected infection',
            'WHOMCH Pain medication given',
        ],
    },
])
