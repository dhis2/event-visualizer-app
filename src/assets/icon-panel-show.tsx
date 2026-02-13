import type { FC } from 'react'

export const IconPanelShow: FC = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        version="1.1"
        style={{ width: 16, height: 16 }}
        fill="none"
    >
        <rect
            x="1.5"
            y="1.5"
            width="13"
            height="13"
            rx="1.5"
            stroke="#4A5768"
        />
        <rect x="9" y="2" width="1" height="12" fill="#4A5768" />
        <path d="M7 6V10L4 8L7 6Z" fill="#4A5768" />
    </svg>
)
