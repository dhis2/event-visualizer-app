import { createRoot } from 'react-dom/client'

const container = document.getElementById('dhis2-app-root')

if (container) {
    createRoot(container).render(<h1>Plugin host</h1>)
}
