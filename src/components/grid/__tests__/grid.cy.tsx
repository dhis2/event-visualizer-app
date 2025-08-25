import { GridCenterColumnBottom } from '../grid-center-column-bottom'
import { GridCenterColumnTop } from '../grid-center-column-top'
import { GridContainer } from '../grid-container'
import { GridEndColumn } from '../grid-end-column'
import { GridStartColumn } from '../grid-start-column'
import { GridTopRow } from '../grid-top-row'

export type ContentSizeProp = {
    width?: number | string
    height?: number | string
}

const SizedBox: React.FC<{
    dataTest: string
    color?: string
    width?: number | string
    height?: number | string
    children?: React.ReactNode
}> = ({
    dataTest,
    color = 'white',
    width = 'auto',
    height = 'auto',
    children,
}) => (
    <div
        style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            background: color,
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

type GridProps = {
    topRowContentSize?: ContentSizeProp
    startColumnContentSize?: ContentSizeProp
    centerColumnTopContentSize?: ContentSizeProp
    centerColumnBottomContentSize?: ContentSizeProp
    endColumnContentSize?: ContentSizeProp
}

const defaultTopRowContentSize = { width: '100%', height: 50 }
const defaultStartColumnContentSize = { width: 300, height: '100%' }
const defaultCenterColumnTopContentSize = { width: '100%', height: 40 }
const defaultCenterColumnBottomContentSize = { width: '100%', height: '100%' }
const defaultEndColumnContentSize = { width: 200, height: '100%' }

const Grid: React.FC<GridProps> = ({
    topRowContentSize = defaultTopRowContentSize,
    startColumnContentSize = defaultStartColumnContentSize,
    centerColumnTopContentSize = defaultCenterColumnTopContentSize,
    centerColumnBottomContentSize = defaultCenterColumnBottomContentSize,
    endColumnContentSize = defaultEndColumnContentSize,
}) => (
    <GridContainer>
        <GridTopRow>
            <SizedBox
                dataTest="top-row-content"
                {...topRowContentSize}
                color="purple"
            />
        </GridTopRow>
        <GridStartColumn>
            <SizedBox
                dataTest="start-column-content"
                {...startColumnContentSize}
                color="magenta"
            />
        </GridStartColumn>
        <GridCenterColumnTop>
            <SizedBox
                dataTest="center-column-top-content"
                {...centerColumnTopContentSize}
                color="orange"
            />
        </GridCenterColumnTop>
        <GridCenterColumnBottom>
            <SizedBox
                dataTest="center-column-bottom-content"
                {...centerColumnBottomContentSize}
                color="lightblue"
            />
        </GridCenterColumnBottom>
        <GridEndColumn>
            <SizedBox
                dataTest="end-column-content"
                {...endColumnContentSize}
                color="grey"
            />
        </GridEndColumn>
    </GridContainer>
)

const FULL_HEIGHT = 1080
const FULL_WIDTH = 1920
const HEADER_BAR_HEIGHT = 48

const OuterContainer: React.FC<{
    showHeaderbar?: boolean
    children?: React.ReactNode
}> = ({ showHeaderbar, children }) => (
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
                display: showHeaderbar ? 'flex' : 'none',
                backgroundColor: 'blue',
                boxSizing: 'border-box',
                border: '4px solid green',
                flexShrink: 0,
            }}
        />
        <div
            data-test="app-shell-app"
            style={{
                flex: '1 1 auto',
                overflow: 'auto',
                height: '100%',
            }}
        >
            {children}
        </div>
    </div>
)

const assertWidth = (dataTest: string, width: number) => {
    cy.getByDataTest(dataTest).invoke('outerWidth').should('eq', width)
}
const assertHeight = (dataTest: string, height: number) => {
    cy.getByDataTest(dataTest).invoke('outerHeight').should('eq', height)
}
const assertSize = (dataTest: string, width: number, height: number) => {
    assertWidth(dataTest, width)
    assertHeight(dataTest, height)
}

describe('Layout Grid', () => {
    beforeEach(() => {
        cy.viewport(FULL_WIDTH, FULL_HEIGHT)
    })

    it('lays out the children correctly in an empty page', () => {
        cy.mount(
            <OuterContainer>
                <Grid />
            </OuterContainer>
        )

        const centerColumnTopHeight = defaultCenterColumnTopContentSize.height
        const topRowHeight = defaultTopRowContentSize.height
        const centerColumnBottomHeight =
            FULL_HEIGHT - topRowHeight - centerColumnTopHeight
        const centerColumnWidth =
            FULL_WIDTH -
            defaultStartColumnContentSize.width -
            defaultEndColumnContentSize.width

        assertSize('grid-container', FULL_WIDTH, FULL_HEIGHT)
        assertSize('grid-top-row', FULL_WIDTH, topRowHeight)
        assertSize('top-row-content', FULL_WIDTH, topRowHeight)
        assertSize(
            'grid-start-column',
            defaultStartColumnContentSize.width,
            FULL_HEIGHT - topRowHeight
        )
        assertSize(
            'start-column-content',
            defaultStartColumnContentSize.width,
            FULL_HEIGHT - topRowHeight
        )
        assertSize(
            'grid-center-column-top',
            centerColumnWidth,
            centerColumnTopHeight
        )
        assertSize(
            'center-column-top-content',
            centerColumnWidth,
            centerColumnTopHeight
        )
        assertSize(
            'grid-center-column-bottom',
            centerColumnWidth,
            centerColumnBottomHeight
        )
        assertSize(
            'center-column-bottom-content',
            centerColumnWidth,
            centerColumnBottomHeight
        )
        assertSize(
            'grid-end-column',
            defaultEndColumnContentSize.width,
            FULL_HEIGHT - topRowHeight
        )
        assertSize(
            'end-column-content',
            defaultEndColumnContentSize.width,
            FULL_HEIGHT - topRowHeight
        )
    })

    it('works correctly when the headerbar is present', () => {
        cy.mount(
            <OuterContainer showHeaderbar={true}>
                <Grid />
            </OuterContainer>
        )

        assertSize(
            'grid-container',
            FULL_WIDTH,
            FULL_HEIGHT - HEADER_BAR_HEIGHT
        )
    })

    it('does not scroll vertically when the top-row becomes excessively high', () => {
        const excessiveHeight = 5000
        cy.mount(
            <OuterContainer>
                <Grid
                    topRowContentSize={{
                        width: '100%',
                        height: excessiveHeight,
                    }}
                />
            </OuterContainer>
        )

        // Layout height remains constant
        assertHeight('grid-container', FULL_HEIGHT)
        // Top row grows to max
        assertHeight(
            'grid-top-row',
            FULL_HEIGHT - defaultCenterColumnTopContentSize.height - 20
        )
        // Top row content grows to specified size with overflow hidden
        assertHeight('top-row-content', excessiveHeight)
        // Center column top remains the specified height
        assertHeight(
            'grid-center-column-top',
            defaultCenterColumnTopContentSize.height
        )
        // Center column bottom shirnks to the value of grid-template-rows bottom row minmax value
        assertHeight('center-column-bottom-content', 20)
    })
    it('does not scroll vertically when the center column top becomes excessively high', () => {
        const excessiveHeight = 5000
        cy.mount(
            <OuterContainer>
                <Grid
                    centerColumnTopContentSize={{
                        width: '100%',
                        height: excessiveHeight,
                    }}
                />
            </OuterContainer>
        )

        // Layout height remains constant
        assertHeight('grid-container', FULL_HEIGHT)
        // Top row remains the specified height
        assertHeight('grid-top-row', defaultTopRowContentSize.height)
        // Center column top grows to max
        assertHeight(
            'grid-center-column-top',
            FULL_HEIGHT - defaultTopRowContentSize.height - 20
        )
        // Center column top content grows to specified size with overflow hidden
        assertHeight('center-column-top-content', excessiveHeight)
        // Center column bottom shirnks to the value of grid-template-rows bottom row minmax value
        assertHeight('center-column-bottom-content', 20)
    })
    it('does not scroll vertically when the center column bottom becomes excessively high', () => {
        const excessiveHeight = 5000
        cy.mount(
            <OuterContainer>
                <Grid
                    centerColumnBottomContentSize={{
                        width: '100%',
                        height: excessiveHeight,
                    }}
                />
            </OuterContainer>
        )

        // Layout height remains constant
        assertHeight('grid-container', FULL_HEIGHT)
        // Top row remains the specified height
        assertHeight('grid-top-row', defaultTopRowContentSize.height)
        // Center column top remains the specified height
        assertHeight(
            'grid-center-column-top',
            defaultCenterColumnTopContentSize.height
        )
        // Center column bottom grows to max
        assertHeight(
            'grid-center-column-bottom',
            FULL_HEIGHT -
                defaultTopRowContentSize.height -
                defaultCenterColumnTopContentSize.height
        )
        // Center column bottom content grows to specified size with overflow hidden
        assertHeight('center-column-bottom-content', excessiveHeight)
    })
    it('does not scroll horizontally when the top-row-content becomes excessively wide', () => {
        const excessiveWidth = 5000
        cy.mount(
            <OuterContainer>
                <Grid
                    topRowContentSize={{ width: excessiveWidth, height: 50 }}
                />
            </OuterContainer>
        )
        assertWidth('grid-container', FULL_WIDTH)
        assertWidth('grid-top-row', FULL_WIDTH)
        assertWidth('top-row-content', excessiveWidth)
    })

    it('does not scroll horizontally when the start and end columns become excessively wide', () => {
        const excessiveWidth = 5000
        const expectedStartEndWidth = (FULL_WIDTH - 20) / 2
        cy.mount(
            <OuterContainer>
                <Grid
                    startColumnContentSize={{
                        width: excessiveWidth,
                        height: '100%',
                    }}
                    endColumnContentSize={{
                        width: excessiveWidth,
                        height: '100%',
                    }}
                />
            </OuterContainer>
        )
        assertWidth('grid-container', FULL_WIDTH)
        assertWidth('grid-start-column', expectedStartEndWidth)
        assertWidth('start-column-content', excessiveWidth)
        assertWidth('grid-end-column', expectedStartEndWidth)
        assertWidth('end-column-content', excessiveWidth)
    })

    it('does not scroll horizontally when the center-column-bottom-content width is excessive', () => {
        const excessiveWidth = 5000
        const expectedCenterColumnWidth =
            FULL_WIDTH -
            defaultStartColumnContentSize.width -
            defaultEndColumnContentSize.width
        cy.mount(
            <OuterContainer>
                <Grid
                    centerColumnBottomContentSize={{
                        width: excessiveWidth,
                        height: '100%',
                    }}
                />
            </OuterContainer>
        )
        assertWidth('grid-container', FULL_WIDTH)
        assertWidth('grid-center-column-top', expectedCenterColumnWidth)
        assertWidth('grid-center-column-bottom', expectedCenterColumnWidth)
        assertWidth('center-column-bottom-content', excessiveWidth)
    })
    it('can visually hide the start column by reducing its content width to zero', () => {
        cy.mount(
            <OuterContainer>
                <Grid
                    startColumnContentSize={{
                        width: 0,
                        height: '100%',
                    }}
                />
            </OuterContainer>
        )
        assertWidth('grid-container', FULL_WIDTH)
        assertWidth('grid-start-column', 0)
        assertWidth(
            'grid-center-column-bottom',
            FULL_WIDTH - defaultEndColumnContentSize.width
        )
        assertWidth('grid-end-column', defaultEndColumnContentSize.width)
    })
    it('can visually hide the end column by reducing its content width to zero', () => {
        cy.mount(
            <OuterContainer>
                <Grid
                    endColumnContentSize={{
                        width: 0,
                        height: '100%',
                    }}
                />
            </OuterContainer>
        )
        assertWidth('grid-container', FULL_WIDTH)
        assertWidth('grid-start-column', defaultStartColumnContentSize.width)
        assertWidth(
            'grid-center-column-bottom',
            FULL_WIDTH - defaultStartColumnContentSize.width
        )
        assertWidth('grid-end-column', 0)
    })
    it('can visually hide the center column top by reducing its content height to zero', () => {
        cy.mount(
            <OuterContainer>
                <Grid
                    centerColumnTopContentSize={{
                        width: '100%',
                        height: 0,
                    }}
                />
            </OuterContainer>
        )
        assertHeight('grid-container', FULL_HEIGHT)
        assertHeight('grid-center-column-top', 0)
        assertHeight(
            'grid-center-column-bottom',
            FULL_HEIGHT - defaultTopRowContentSize.height
        )
    })
})
