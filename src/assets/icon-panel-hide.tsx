import type { FC } from 'react'

export const IconPanelHide: FC = () => (
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
        <rect
            x="10"
            y="2"
            width="4"
            height="12"
            fill="#4A5768"
            fillOpacity="0.2"
        />
        <path d="M4 10V6L7 8L4 10Z" fill="#4A5768" />
    </svg>
)
