import { MockAppWrapper } from '../app-wrapper'
import { useCurrentUser, useMetadataItem } from '@hooks'

const TestComponent = () => {
    const currentUser = useCurrentUser()
    const userOrgUnitMetadata = useMetadataItem('USER_ORGUNIT')

    return (
        <div>
            <div data-test="current-user">
                {currentUser?.username || 'No User'}
            </div>
            <div data-test="metadata">
                {userOrgUnitMetadata?.name || 'No Metadata'}
            </div>
        </div>
    )
}

describe('MockAppWrapper', () => {
    it('should provide mocked app context with AppCachedDataQueryProvider and MetadataContext', () => {
        cy.mount(
            <MockAppWrapper>
                <TestComponent />
            </MockAppWrapper>
        )

        cy.getByDataTest('current-user').should('contain.text', 'admin')
        cy.getByDataTest('metadata').should(
            'contain.text',
            'User organisation unit'
        )
    })

    it('should inject DHIS2 CSS variables into the DOM', () => {
        cy.mount(
            <MockAppWrapper>
                <div data-test="css-test">CSS Variables Test</div>
            </MockAppWrapper>
        )

        cy.get('body').should(($body) => {
            const getCssVariableValue = (cssVariableName: string) =>
                window
                    .getComputedStyle($body[0])
                    .getPropertyValue(cssVariableName)

            expect(getCssVariableValue('--colors-blue900')).to.equal('#093371')
            expect(getCssVariableValue('--theme-fonts')).to.equal(
                'Roboto, sans-serif'
            )
            expect(getCssVariableValue('--theme-focus')).to.equal('#147cd7')
            expect(getCssVariableValue('--spacers-dp4')).to.equal('4px')
        })
    })
})
