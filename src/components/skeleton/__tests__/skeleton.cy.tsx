import { SkeletonContainer } from '../skeleton-container'

describe('<SkeletonContainer />', () => {
    it('renders', () => {
        // see: https://on.cypress.io/mounting-react

        cy.mount(<SkeletonContainer />)
    })
})
