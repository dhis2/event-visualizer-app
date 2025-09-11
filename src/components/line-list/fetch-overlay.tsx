import { Center, CircularLoader, Cover } from '@dhis2/ui'

export const FetchOverlay = () => (
    <Cover translucent>
        <Center>
            <CircularLoader />
        </Center>
    </Cover>
)
