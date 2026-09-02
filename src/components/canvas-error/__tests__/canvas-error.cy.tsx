import type { EngineError } from '@api/parse-engine-error'
import { CssVariables } from '@dhis2/ui'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import type { CanvasErrorIcon } from '@modules/error/icons'
import type { FC, PropsWithChildren } from 'react'
import { CanvasError } from '../canvas-error'

/* Every canvas error screen, mounted for real so the rendered copy, the
 * illustration and the Retry button can be inspected by eye in the Cypress
 * runner as well as asserted. The mapping logic behind these screens is covered
 * by get-error-display.spec.ts. */

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
        label: 'E7123 — no access to data',
        error: engineError({ errorCode: 'E7123' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7132 — indicator problem',
        error: engineError({ errorCode: 'E7132' }),
        title: 'Something went wrong',
        description: "There's a problem with at least one selected indicator.",
        icon: 'data',
        retryable: false,
    },
    {
        label: 'E7144 — generated analytics problem',
        error: engineError({ errorCode: 'E7144' }),
        title: 'Something went wrong',
        description:
            "There's a problem with the generated analytics. Contact a system administrator.",
        icon: 'generic',
        retryable: false,
    },
    {
        label: 'E7145 — request syntax problem',
        error: engineError({ errorCode: 'E7145' }),
        title: 'Something went wrong',
        description: "There's a syntax problem with the analytics request.",
        icon: 'generic',
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

const canvasError = () => cy.getByDataTest('canvas-error')

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

                canvasError().should('be.visible')
                canvasError().should('contain.text', title)
                canvasError().should('contain.text', description)
                canvasError()
                    .findByDataTest(`canvas-error-icon-${icon}`)
                    .should('be.visible')

                cy.contains('button', 'Retry').should(
                    retryable ? 'be.visible' : 'not.exist'
                )
            })
        }
    )

    it('renders every screen at once for visual comparison', () => {
        cy.viewport(700, 1600)
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

        canvasError().should('have.length', ERROR_SCREENS.length)
    })
})
