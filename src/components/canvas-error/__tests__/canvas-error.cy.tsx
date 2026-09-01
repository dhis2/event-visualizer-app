import type { EngineError } from '@api/parse-engine-error'
import { CssVariables } from '@dhis2/ui'
import { EmptyResponseError } from '@modules/error/empty-response-error'
import type { FC, PropsWithChildren } from 'react'
import { CanvasError } from '../canvas-error'

/* Every canvas error screen, mounted for real so the rendered copy, the
 * error-vs-info styling and the Retry button can be inspected by eye in the
 * Cypress runner as well as asserted. The mapping logic behind these screens is
 * covered by get-error-display.spec.ts. */

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
    severity: 'error' | 'info'
    retryable: boolean
}

const ERROR_SCREENS: ErrorScreen[] = [
    {
        label: 'empty response',
        error: new EmptyResponseError(),
        title: 'No data',
        description:
            "The selected dimensions didn't return any data. There may be no data, or you may not have access to it.",
        severity: 'info',
        retryable: false,
    },
    {
        label: 'E7120 — no access to org units',
        error: engineError({ errorCode: 'E7120' }),
        title: 'Restricted access',
        description:
            "You don't have access to one or more of the chosen organisation units.",
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7121 — no access to data',
        error: engineError({ errorCode: 'E7121' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7123 — no access to data',
        error: engineError({ errorCode: 'E7123' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7132 — indicator problem',
        error: engineError({ errorCode: 'E7132' }),
        title: 'Something went wrong',
        description: "There's a problem with at least one selected indicator.",
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7144 — generated analytics problem',
        error: engineError({ errorCode: 'E7144' }),
        title: 'Something went wrong',
        description:
            "There's a problem with the generated analytics. Contact a system administrator.",
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7145 — request syntax problem',
        error: engineError({ errorCode: 'E7145' }),
        title: 'Something went wrong',
        description: "There's a syntax problem with the analytics request.",
        severity: 'error',
        retryable: false,
    },
    {
        label: 'E7217 — no access to event analytics',
        error: engineError({ errorCode: 'E7217' }),
        title: 'Restricted access',
        description:
            "You don't have access to event analytics. Contact a system administrator.",
        severity: 'error',
        retryable: false,
    },
    {
        label: 'access denied without an error code',
        error: engineError({ type: 'access' }),
        title: 'Restricted access',
        description: NO_ACCESS_TO_DATA,
        severity: 'error',
        retryable: false,
    },
    {
        label: 'unrecognised server failure',
        error: engineError({ type: 'network' }),
        title: 'Something went wrong',
        description: 'There was a problem getting the data from the server.',
        severity: 'error',
        retryable: true,
    },
]

const noticeBox = () => cy.getByDataTest('dhis2-uicore-noticebox')

const Harness: FC<PropsWithChildren> = ({ children }) => (
    <>
        <CssVariables colors spacers theme />
        {children}
    </>
)

describe('<CanvasError />', () => {
    ERROR_SCREENS.forEach(
        ({ label, error, title, description, severity, retryable }) => {
            it(`renders the "${label}" screen`, () => {
                cy.mount(
                    <Harness>
                        <CanvasError error={error} onRetry={cy.stub()} />
                    </Harness>
                )

                noticeBox().should('be.visible')
                noticeBox().should('contain.text', title)
                noticeBox().should('contain.text', description)

                /* The red error styling vs the blue info styling is the only
                 * place severity becomes visible. */
                noticeBox().should(
                    severity === 'error' ? 'have.class' : 'not.have.class',
                    'error'
                )

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

        noticeBox().should('have.length', ERROR_SCREENS.length)
    })
})
