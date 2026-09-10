import type { EngineError } from '@api/parse-engine-error'
import { CssVariables } from '@dhis2/ui'
import type { CanvasErrorIcon } from '@modules/error/canvas-error-display'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import type { FC, PropsWithChildren } from 'react'
import { CanvasError } from '../canvas-error'

/* Every canvas error screen, mounted for real so the copy, the illustration
 * and the Retry button can be inspected by eye in the Cypress runner as well as
 * asserted. The mapping behind them is covered by get-error-display.spec.ts. */

const engineError = (partial: Partial<EngineError>): EngineError => ({
    type: 'unknown',
    message: 'forced by test',
    ...partial,
})

const NO_ACCESS_TO_DATA =
    "You don't have access to the data in this visualization. Contact a system administrator."

type ErrorScreen = {
    label: string
    error: EngineError | EmptyResponseError
    title: string
    description: string
    icon: CanvasErrorIcon
    retryable: boolean
}

const ERROR_SCREENS: ErrorScreen[] = [
    {
        label: 'empty response',
        error: new EmptyResponseError(),
        title: 'No data available',
        description:
            "The selected dimensions didn't return any data. There may be no data, or you may not have access to it.",
        icon: 'emptyBox',
        retryable: false,
    },
    {
        label: 'E1005 — visualization does not exist',
        error: engineError({ errorCode: 'E1005' }),
        title: 'Visualization not found',
        description:
            'The visualization you are trying to view could not be found, the ID could be incorrect or it could have been deleted.',
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'E7120 — no access to org units',
        error: engineError({ errorCode: 'E7120' }),
        title: 'Restricted access',
        description:
            "You don't have access to one or more of the chosen organisation units.",
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7121 — no access to data',
        error: engineError({ errorCode: 'E7121' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7123 — no readable items in a constrained dimension',
        error: engineError({ errorCode: 'E7123' }),
        title: 'Restricted access',
        description:
            "You don't have access to any items in a dimension your user account is restricted to. Contact a system administrator.",
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7217 — no access to event analytics',
        error: engineError({ errorCode: 'E7217' }),
        title: 'Restricted access',
        description:
            "You don't have access to event analytics. Contact a system administrator.",
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7132 — indicator problem',
        error: engineError({ errorCode: 'E7132' }),
        title: 'Invalid indicator',
        description: "There's a problem with at least one selected indicator.",
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7245 — stage no longer in its program',
        error: engineError({ errorCode: 'E7245' }),
        title: 'Program stage not available',
        description:
            'A program stage in this visualization is no longer part of its program. It may have been changed or removed.',
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7226 — dimension cannot be resolved',
        error: engineError({ errorCode: 'E7226' }),
        title: 'Dimension not available',
        description:
            'A dimension in this visualization is no longer valid. It may have been removed from the program.',
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7142 — program not on the tracked entity type',
        error: engineError({ errorCode: 'E7142' }),
        title: 'Program not available',
        description:
            'A program in this visualization is not available for the selected tracked entity type.',
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7128 — result set over the server maximum',
        error: engineError({ errorCode: 'E7128' }),
        title: 'Too much data',
        description:
            'This request returns more data than the server allows. Add a filter or choose a shorter period.',
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7209 — top limit over the server maximum',
        error: engineError({ errorCode: 'E7209' }),
        title: 'Top limit too high',
        description:
            'The top limit in this visualization is higher than the server allows. Lower it in the options.',
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'E7131 — query timed out',
        error: engineError({ errorCode: 'E7131' }),
        title: 'Request timed out',
        description:
            'The request took too long and was stopped. Try again, or reduce the amount of data requested.',
        icon: 'generic',
        retryable: true,
    },
    {
        label: 'E7144 — analytics tables missing',
        error: engineError({ errorCode: 'E7144' }),
        title: 'Analytics not generated',
        description:
            'The analytics tables have not been generated. Contact a system administrator.',
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'E7145 — query could not be run',
        error: engineError({ errorCode: 'E7145' }),
        title: 'Analytics request failed',
        description:
            'The server could not run this request. Contact a system administrator.',
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'unrecognised code on a rejected request',
        error: engineError({
            type: 'access',
            errorCode: 'E7250',
            message: 'Dimension is not a fully qualified: `abc.def`',
        }),
        title: 'Analytics request error',
        description: 'Dimension is not a fully qualified: `abc.def`',
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'access denied without an error code',
        error: engineError({ type: 'access' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        icon: 'data',
        retryable: false,
    },
    {
        label: 'unrecognised server failure',
        error: engineError({ type: 'network' }),
        title: 'Something went wrong',
        description: 'There was a problem getting the data from the server.',
        icon: 'generic',
        retryable: true,
    },
]

const Harness: FC<PropsWithChildren> = ({ children }) => (
    <>
        <CssVariables colors spacers theme />
        {children}
    </>
)

describe('<CanvasError />', () => {
    ERROR_SCREENS.forEach(
        ({ label, error, title, description, icon, retryable }) => {
            it(`renders the "${label}" screen`, () => {
                cy.mount(
                    <Harness>
                        <CanvasError error={error} onRetry={cy.stub()} />
                    </Harness>
                )

                cy.getByDataTest('canvas-error')
                    .should('be.visible')
                    .and('contain.text', title)
                    .and('contain.text', description)
                    .findByDataTest(`canvas-error-icon-${icon}`)
                    .should('be.visible')

                cy.contains('button', 'Retry').should(
                    retryable ? 'be.visible' : 'not.exist'
                )
            })
        }
    )

    it('renders every screen at once for visual comparison', () => {
        cy.viewport(700, 2800)
        cy.mount(
            <Harness>
                {ERROR_SCREENS.map(({ label, error }) => (
                    <div key={label}>
                        <p style={{ fontFamily: 'monospace' }}>{label}</p>
                        <CanvasError error={error} onRetry={cy.stub()} />
                    </div>
                ))}
            </Harness>
        )

        cy.getByDataTest('canvas-error').should(
            'have.length',
            ERROR_SCREENS.length
        )
    })
})
