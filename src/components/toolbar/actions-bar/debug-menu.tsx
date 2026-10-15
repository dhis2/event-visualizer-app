import {
    setTotalsMode,
    useTotalsMode,
    type TotalsMode,
} from '@components/line-list/totals-debug'
import {
    HoverMenuDropdown,
    HoverMenuList,
    HoverMenuListItem,
} from '@dhis2/analytics'
import i18n from '@dhis2/d2-i18n'
import { IconCheckmark16, MenuSectionHeader } from '@dhis2/ui'
import type { FC } from 'react'
import classes from './styles/actions-bar.module.css'

/* Prototype-only menu so testers can try the pagination with and without
 * page totals, without using the browser console. */
export const DebugMenu: FC = () => {
    const totalsMode = useTotalsMode()
    const options: Array<{ mode: TotalsMode; label: string }> = [
        { mode: 'off', label: i18n.t('No totals') },
        { mode: 'fake', label: i18n.t('Fake totals (1,234 rows)') },
        { mode: 'fake-large', label: i18n.t('Fake totals (24,700 rows)') },
    ]

    return (
        <HoverMenuDropdown
            label={i18n.t('Debug')}
            className={classes.menuDropdown}
        >
            <HoverMenuList>
                <MenuSectionHeader
                    label={i18n.t('Line list page totals')}
                    hideDivider
                    dense
                />
                {options.map(({ mode, label }) => (
                    <HoverMenuListItem
                        key={mode}
                        label={label}
                        icon={
                            mode === totalsMode ? (
                                <IconCheckmark16 />
                            ) : (
                                <span className={classes.menuIconSpacer} />
                            )
                        }
                        onClick={() => setTotalsMode(mode)}
                    />
                ))}
            </HoverMenuList>
        </HoverMenuDropdown>
    )
}
