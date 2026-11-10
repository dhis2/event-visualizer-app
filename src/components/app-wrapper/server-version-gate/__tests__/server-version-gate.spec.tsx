import { useConfig } from '@dhis2/app-runtime'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ServerVersionGate } from '../server-version-gate'

vi.mock('@dhis2/app-runtime', () => ({ useConfig: vi.fn() }))

const renderWithVersion = (full: string) => {
    const [mainVersion, tag] = full.split('-')
    const [major, minor, patch] = mainVersion
        .split('.')
        .map((part) => Number.parseInt(part))
    vi.mocked(useConfig).mockReturnValue({
        serverVersion: { full, major, minor, patch, tag },
    } as ReturnType<typeof useConfig>)

    render(
        <ServerVersionGate>
            <div>app content</div>
        </ServerVersionGate>
    )
}

describe('ServerVersionGate', () => {
    it.each(['2.43.0', '2.43.2', '2.43-SNAPSHOT', '2.42.4'])(
        'blocks the app on %s',
        (version) => {
            renderWithVersion(version)

            expect(screen.queryByText('app content')).not.toBeInTheDocument()
            expect(
                screen.getByText('This app needs a newer version of DHIS2')
            ).toBeInTheDocument()
        }
    )

    it('shows the server version and the version the app needs', () => {
        renderWithVersion('2.43.2')

        expect(
            screen.getByText(
                'This server is running version 2.43.2. Individual Data Visualizer needs 2.43.3 or later.'
            )
        ).toBeInTheDocument()
    })

    it.each(['2.43.3', '2.43.4', '2.44.0', '2.44-SNAPSHOT'])(
        'renders the app on %s',
        (version) => {
            renderWithVersion(version)

            expect(screen.getByText('app content')).toBeInTheDocument()
        }
    )

    it('renders the app when the server version is unknown', () => {
        vi.mocked(useConfig).mockReturnValue({} as ReturnType<typeof useConfig>)

        render(
            <ServerVersionGate>
                <div>app content</div>
            </ServerVersionGate>
        )

        expect(screen.getByText('app content')).toBeInTheDocument()
    })
})
