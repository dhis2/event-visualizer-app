import { describeSavedVisualizations } from '../support/saved-visualizations'

describeSavedVisualizations('enrollment pivot tables', [
    {
        covers: 'Enrollment pivot table, several stages with enrollment dimensions',
        id: 'Z2mxfl7gTTA',
        name: 'E2E: Enrollment pivot table, several stages',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active'],
        rowHeaders: ['Bo', 'NVP only', 'Others'],
    },
    {
        covers: 'Enrollment pivot table, data element value',
        id: 'unFRccFpt4V',
        name: 'E2E: Enrollment pivot table, data element value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Active'],
        rowHeaders: ['Bo', 'Western Area'],
        /* The backend does not store the value's program stage yet, and an
         * enrollment pivot table can't be requested without it */
        skip: true,
    },
    {
        covers: 'Enrollment pivot table, attribute value',
        id: 'O2sqK93AD4w',
        name: 'E2E: Enrollment pivot table, attribute value',
        type: 'PIVOT_TABLE',
        columnHeaders: ['Male', 'Female'],
        rowHeaders: ['Bo', 'Western Area'],
    },
])
