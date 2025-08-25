import React from 'react'
import styles from './styles/icon-button.module.css'

interface IconButtonProps {
    children: React.ReactNode
    dataTest?: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
    menuId?: string
}

export const IconButton: React.FC<IconButtonProps> = ({
    children,
    dataTest,
    onClick,
    menuId,
}) => (
    <button
        className={styles.iconButton}
        data-test={dataTest}
        onClick={onClick}
        aria-owns={menuId}
        aria-haspopup={menuId ? 'true' : 'false'}
    >
        {children}
    </button>
)
