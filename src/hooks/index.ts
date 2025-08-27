// eslint-disable-next-line no-restricted-imports
import { useDispatch, useSelector, useStore } from 'react-redux'
import { api } from '@api/api'
import type { RootState, AppDispatch, AppStore } from '@store/store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
export {
    useAppCachedDataQuery,
    useCurrentUser,
    useSystemSettings,
    useRootOrgUnits,
    useOrgUnitLevels,
} from '@components/app-wrapper/app-cached-data-query-provider'
export { useScrollBoxWidth } from '@components/scroll-box/scroll-box'
/* Note that useRtkQuery and useRtkLazyQuery accept both a complex query object
 * (as useDataQuery from @dhis2/app-runtime) which can be used to query multiple
 * resource at once, as well as a simple query object which can be used to query
 * one resource at a time. The advantage of adding this is that you avoid having
 * to work with nested objects in the query definition or the data. */
export * from './use-rtk-query'
export * from './use-rtk-lazy-query'

export const { useMutateMutation: useRtkMutation } = api

export type UseRtkMutationResult = ReturnType<typeof useRtkMutation>
