import { SkeletonContainer } from '../skeleton-container'

const SizedBox: React.FC<{
    dataTest?: string
    width?: number | string
    height?: number | string
    children?: React.ReactNode
}> = ({ dataTest = 'sized-box', width = 50, height = 50, children }) => (
    <div
        style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            background: '#e0e0e0',
            border: '1px solid #bdbdbd',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
        data-test={dataTest}
    >
        {children}
    </div>
)

const FULL_HEIGHT = 1080
const FULL_WIDTH = 1920
const HEADER_BAR_HEIGHT = 48

const OuterContainer: React.FC<{
    showHeaderbar?: boolean
    children?: React.ReactNode
}> = ({ showHeaderbar = true, children }) => (
    <SizedBox
        width={FULL_WIDTH}
        height={FULL_HEIGHT}
        dataTest="outer-container"
    >
        <div
            data-test="app-shell-adapter"
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                data-test="app-shell-headerbar"
                style={{
                    height: HEADER_BAR_HEIGHT,
                    display: showHeaderbar ? 'block' : 'none',
                }}
            />
            <div
                data-test="app-shell-app"
                style={{ flex: '1 1 auto', overflow: 'auto', height: '100%' }}
            >
                {children}
            </div>
        </div>
    </SizedBox>
)

describe('<SkeletonContainer />', () => {
    it('renders', () => {
        // see: https://on.cypress.io/mounting-react

        cy.mount(
            <OuterContainer>
                <SkeletonContainer />
            </OuterContainer>
        )
    })
})
