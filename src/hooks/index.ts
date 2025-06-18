import { useDispatch, useSelector } from 'react-redux'
import { api } from '../api'
import type { RootState, AppDispatch } from '../store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export {
    useAppCachedDataQuery,
    useCurrentUser,
    useSystemSettings,
    useRootOrgUnits,
    useOrgUnitLevels,
} from '../app-wrapper/app-cached-data-query-provider'

/* Note that useRtkQuery accepts both a complex query object (as useDataQuery
 * from @dhis2/app-runtime) which can be used to query multiple resource at once,
 * as well as a simple query object which can be used to query one resource at a
 * time. The advantage of adding this is that you avoid having to work with nested
 * objects in the query definition or the data. */
export const {
    useQueryQuery: useRtkQuery,
    useLazyQueryQuery: useRtkLazyQuery,
    useMutateMutation: useRtkMutation,
} = api
