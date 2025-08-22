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
                color="blue"
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

const assertSize = (dataTest: string, width: number, height: number) => {
    cy.getByDataTest(dataTest).invoke('outerWidth').should('eq', width)
    cy.getByDataTest(dataTest).invoke('outerHeight').should('eq', height)
}

describe('Layout Grid', () => {
    beforeEach(() => {
        cy.viewport(FULL_WIDTH, FULL_HEIGHT)
    })

    it('lays out the children correctly', () => {
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
})

// describe('App Grid Container', () => {
//     beforeEach(() => {
//         cy.viewport(FULL_WIDTH, FULL_HEIGHT)
//     })

//     it('occupies the full space with headerbar', () => {
//         cy.mount(
//             <OuterContainer showHeaderbar={true}>
//                 <Grid />
//             </OuterContainer>
//         )

//         cy.getByDataTest('grid-container')
//             .invoke('outerHeight')
//             .should('eq', FULL_HEIGHT - HEADER_BAR_HEIGHT)
//     })

//     it('occupies the full space without headerbar', () => {
//         cy.mount(
//             <OuterContainer showHeaderbar={false}>
//                 <Grid />
//             </OuterContainer>
//         )

//         cy.getByDataTest('grid-container')
//             .invoke('outerHeight')
//             .should('eq', FULL_HEIGHT)
//     })

//     it('distributes its children as rows', () => {
//         const height = 100
//         cy.mount(
//             <OuterContainer>
//                 <Grid
//                     topRowContentSize={{ height }}
//                     startColumnContentSize={{ height }}
//                     centerColumnTopContentSize={{ height }}
//                     centerColumnBottomContentSize={{ height }}
//                     endColumnContentSize={{ height }}
//                 />
//             </OuterContainer>
//         )

//         cy.getByDataTest('top-row-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//         cy.getByDataTest('start-column-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//         cy.getByDataTest('center-column-top-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//         cy.getByDataTest('centercolumnbottom-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//         cy.getByDataTest('end-column-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//     })
// })

// describe('App Grid TopRow and Main', () => {
//     beforeEach(() => {
//         cy.viewport(FULL_WIDTH, FULL_HEIGHT)
//     })

//     it('Main occupies the remaining space not taken by TopRow', () => {
//         const height = 100
//         cy.mount(
//             <OuterContainer>
//                 <Grid topRowContentSize={{ height }} />
//             </OuterContainer>
//         )

//         cy.getByDataTest('top-row-content')
//             .invoke('outerHeight')
//             .should('eq', height)
//         cy.getByDataTest('centercolumnbottom-content')
//             .invoke('outerHeight')
//             .should('eq', FULL_HEIGHT - height)
//         cy.getByDataTest('top-row-content')
//             .invoke('outerWidth')
//             .should('eq', FULL_WIDTH)
//         cy.getByDataTest('centercolumnbottom-content')
//             .invoke('outerWidth')
//             .should('eq', FULL_WIDTH)
//     })

//     it('Main constricts its content width and height', () => {
//         const height = 3000
//         const width = 4000
//         cy.mount(
//             <OuterContainer>
//                 <Grid centerColumnBottomContentSize={{ height, width }} />
//             </OuterContainer>
//         )

//         cy.getByDataTest('centercolumnbottom-content')
//             .invoke('outerHeight')
//             .should('eq', FULL_HEIGHT)

//         cy.getByDataTest('gridmain')
//             .invoke('outerHeight')
//             .should('eq', FULL_HEIGHT)

//         cy.getByDataTest('centercolumnbottom-content')
//             .invoke('outerWidth')
//             .should('eq', FULL_WIDTH)

//         cy.getByDataTest('gridmain')
//             .invoke('outerWidth')
//             .should('eq', FULL_WIDTH)
//     })

//     // it('Main does not grow when its content is too high', () => {
//     // })
// })
