import { useAppSelector } from '@hooks'
import { getVisUiConfigConditionsByDimension } from '@store/vis-ui-config-slice'
import type { DimensionMetadataItem } from '@types'
import { type FC, type ReactNode, useLayoutEffect, useRef } from 'react'
import { FilteringSection } from './filtering-section'
import { GroupingSection } from './grouping-section'
import classes from './styles/conditions-modal-content.module.css'
import { useDimensionLegendSets } from './use-dimension-legend-sets'

const FADE_MS = 160

type ConditionsTabContentProps = {
    dimension: DimensionMetadataItem
}

export const ConditionsTabContent: FC<ConditionsTabContentProps> = ({
    dimension,
}) => {
    const { legendSets } = useDimensionLegendSets(dimension)
    const { legendSet: selectedLegendSetId } = useAppSelector((state) =>
        getVisUiConfigConditionsByDimension(state, dimension.id)
    )

    const canBeGrouped = legendSets.length > 0
    const groupingKey = selectedLegendSetId ?? 'ungrouped'

    return (
        <div className={classes.tabContent}>
            {canBeGrouped && (
                <GroupingSection
                    dimensionId={dimension.id}
                    legendSets={legendSets}
                />
            )}
            {/* Keyed on the grouping value so a change remounts the filter,
                clearing out filter state left from the previous grouping. */}
            <FadeOnChange swapKey={canBeGrouped ? groupingKey : null}>
                <FilteringSection
                    key={groupingKey}
                    dimension={dimension}
                    showHeading={canBeGrouped}
                />
            </FadeOnChange>
        </div>
    )
}

const FadeOnChange: FC<{ swapKey: string | null; children: ReactNode }> = ({
    swapKey,
    children,
}) => {
    const wrapRef = useRef<HTMLDivElement>(null)
    const prevKey = useRef(swapKey)
    const pendingClone = useRef<HTMLElement | null>(null)

    if (
        swapKey !== null &&
        prevKey.current !== null &&
        prevKey.current !== swapKey &&
        wrapRef.current &&
        !pendingClone.current
    ) {
        pendingClone.current = wrapRef.current.cloneNode(true) as HTMLElement
    }
    prevKey.current = swapKey

    useLayoutEffect(() => {
        const clone = pendingClone.current
        const el = wrapRef.current
        const parent = el?.parentElement
        if (!clone || !el || !parent) {
            return
        }
        pendingClone.current = null

        clone.className = classes.filteringFadeClone
        clone.setAttribute('aria-hidden', 'true')
        clone.querySelectorAll('input').forEach((input) => {
            input.removeAttribute('name')
            input.disabled = true
        })

        el.style.opacity = '0'
        el.style.transition = 'none'
        parent.appendChild(clone)

        const fadeOut = window.requestAnimationFrame(() => {
            clone.style.opacity = '0'
        })

        let finished = false
        const fadeIn = (): void => {
            if (finished) {
                return
            }
            finished = true
            clone.remove()
            el.style.transition = `opacity ${FADE_MS}ms ease`
            el.style.opacity = '1'
        }
        clone.addEventListener('transitionend', fadeIn, { once: true })
        const fallback = window.setTimeout(fadeIn, FADE_MS + 50)

        return () => {
            window.cancelAnimationFrame(fadeOut)
            window.clearTimeout(fallback)
            clone.remove()
            el.style.opacity = ''
            el.style.transition = ''
        }
    }, [swapKey])

    return (
        <div className={classes.filteringFadeWrap}>
            <div ref={wrapRef}>{children}</div>
        </div>
    )
}
