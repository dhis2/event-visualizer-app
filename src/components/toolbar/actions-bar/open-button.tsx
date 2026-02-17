import i18n from '@dhis2/d2-i18n'
import { Button, IconFolderOpen16 } from '@dhis2/ui'
import { type FC } from 'react'
import classes from './styles/button.module.css'

type OpenButtonProps = {
    onClick: () => void
}

export const OpenButton: FC<OpenButtonProps> = ({ onClick }) => {
    return (
        <Button
            icon={<IconFolderOpen16 color="#6C7787 " />}
            onClick={onClick}
            dataTest="open-button"
            className={classes.button}
            small
        >
            <span className={classes.label}>{i18n.t('Open')}</span>
        </Button>
    )
}
