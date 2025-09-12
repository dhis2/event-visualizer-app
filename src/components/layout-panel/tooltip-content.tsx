// import {
//     ouIdHelper,
// } from '@dhis2/analytics'
// import i18n from '@dhis2/d2-i18n'
import React from 'react'
// import {
//     isStartEndDate,
//     useLocalizedStartEndDateFormatter,
// } from '../../modules/dates.js'
// import { 'STATUS' } from '../../modules/dimensionConstants.js'
// import { extractDimensionIdParts } from '../../modules/dimensionId.js'
// import { sGetMetadata } from '../../reducers/metadata.js'
// import { sGetUiInputType, sGetUiItemsByDimension } from '../../reducers/ui.js'
// import styles from './styles/Tooltip.module.css'

// const renderLimit = 5

export const TooltipContent = () => {
    return <div>Tooltip content</div>
}

// export const TooltipContent = ({ dimension, conditionsTexts, axisId }) => {
//     const metadata = useSelector(sGetMetadata)
//     const inputType = useSelector(sGetUiInputType)
//     const itemIds = useSelector((state) =>
//         sGetUiItemsByDimension(state, dimension.id)
//     )
//     const formatStartEndDate = useLocalizedStartEndDateFormatter()

//     const { programStageId, programId } = extractDimensionIdParts(
//         dimension.id,
//         inputType
//     )

//     const stageName = dimension.stageName || metadata[programStageId]?.name
//     const programName = metadata[programId]?.name

//     const getNameList = (idList, label, metadata) =>
//         idList.reduce(
//             (levelString, levelId, index) =>
//                 `${levelString}${index > 0 ? `, ` : ``}${
//                     metadata[levelId] ? metadata[levelId].name : levelId
//                 }`,
//             `${label}: `
//         )

//     const getItemDisplayNames = () => {
//         const levelIds = []
//         const groupIds = []
//         const itemDisplayNames = []

//         itemIds.forEach((id) => {
//             if (ouIdHelper.hasLevelPrefix(id)) {
//                 levelIds.push(ouIdHelper.removePrefix(id))
//             } else if (ouIdHelper.hasGroupPrefix(id)) {
//                 groupIds.push(ouIdHelper.removePrefix(id))
//             } else {
//                 const { dimensionId } = extractDimensionIdParts(id, inputType)
//                 itemDisplayNames.push(
//                     isStartEndDate(dimensionId)
//                         ? formatStartEndDate(dimensionId)
//                         : metadata[dimensionId]?.name ?? id
//                 )
//             }
//         })

//         levelIds.length &&
//             itemDisplayNames.push(
//                 getNameList(levelIds, i18n.t('Levels'), metadata)
//             )

//         groupIds.length &&
//             itemDisplayNames.push(
//                 getNameList(groupIds, i18n.t('Groups'), metadata)
//             )

//         return itemDisplayNames
//     }

//     const renderItems = (itemDisplayNames = []) => {
//         if (itemDisplayNames.some((name) => !name)) {
//             return null
//         }
//         const itemsToRender = itemDisplayNames
//             .slice(0, renderLimit)
//             .map((name) => (
//                 <li key={`${dimension.id}-${name}`} className={styles.item}>
//                     {name}
//                 </li>
//             ))

//         const numberOverRenderLimit = itemDisplayNames.length - renderLimit
//         if (numberOverRenderLimit > 0) {
//             itemsToRender.push(
//                 <li
//                     key={`${dimension.id}-render-limit`}
//                     className={styles.item}
//                 >
//                     {i18n.t('And {{count}} other...', {
//                         count: numberOverRenderLimit,
//                         defaultValue: 'And {{count}} other...',
//                         defaultValue_plural: 'And {{count}} others...',
//                     })}
//                 </li>
//             )
//         }

//         return itemsToRender
//     }

//     const renderNoItemsLabel = () => (
//         <li key={`${dimension.id}-none-selected`} className={styles.item}>
//             {i18n.t('None selected')}
//         </li>
//     )

//     const renderStageName = () =>
//         stageName && (
//             <li className={styles.item}>
//                 {i18n.t('Program stage: {{- stageName}}', {
//                     stageName,
//                     nsSeparator: '^^',
//                 })}
//             </li>
//         )

//     const renderProgramName = () =>
//         programName && (
//             <li className={styles.item}>
//                 {i18n.t('Program: {{- programName}}', {
//                     programName,
//                     nsSeparator: '^^',
//                 })}
//             </li>
//         )

//     const renderItemsSection = (itemsList) => {
//         if (itemsList.length) {
//             return renderItems(itemsList)
//         } else if (axisId === 'filters') {
//             return renderNoItemsLabel()
//         } else {
//             return (
//                 <li
//                     key={`${dimension.id}-all-selected`}
//                     className={styles.item}
//                 >
//                     {i18n.t('Showing all values for this dimension')}
//                 </li>
//             )
//         }
//     }

//     const itemDisplayNames = Boolean(itemIds.length) && getItemDisplayNames()

//     switch (dimension.dimensionType) {
//         case 'CATEGORY':
//         case 'CATEGORY_OPTION_GROUP_SET':
//         case 'ORGANISATION_UNIT_GROUP_SET':
//         case 'STATUS':
//             return (
//                 <ul className={styles.list} data-test="tooltip-content">
//                     {renderProgramName()}
//                     {renderItemsSection(itemDisplayNames)}
//                 </ul>
//             )
//         case 'PERIOD':
//         case 'ORGANISATION_UNIT':
//             return (
//                 <ul className={styles.list} data-test="tooltip-content">
//                     {renderProgramName()}
//                     {itemDisplayNames
//                         ? renderItems(itemDisplayNames)
//                         : renderNoItemsLabel()}
//                 </ul>
//             )
//         case 'DATA_ELEMENT': {
//             return (
//                 <ul className={styles.list} data-test="tooltip-content">
//                     {renderProgramName()}
//                     {renderStageName()}
//                     {renderItemsSection(conditionsTexts)}
//                 </ul>
//             )
//         }
//         default: {
//             return (
//                 <ul className={styles.list} data-test="tooltip-content">
//                     {renderProgramName()}
//                     {renderItemsSection(conditionsTexts)}
//                 </ul>
//             )
//         }
//     }
// }
