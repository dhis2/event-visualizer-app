import { MockAppWrapper } from '../app-wrapper'
import { useMetadataItem } from '@components/app-wrapper/metadata-provider'
import { useCurrentUser } from '@hooks'

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
})
