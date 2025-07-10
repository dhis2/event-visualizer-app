import React, { useState, useCallback } from 'react'
import { useRtkMutation } from '../../hooks'

export const DashboardExample = () => {
    const [dashboardName, setDashboardName] = useState('')
    const [dashboardId, setDashboardId] = useState('')
    const [trigger, { data, error, isLoading, isSuccess, isError }] =
        useRtkMutation()

    // Handle input change
    const handleNameChange = useCallback((e) => {
        setDashboardName(e.target.value)
    }, [])

    // Create dashboard
    const handleCreate = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'create',
            data: { name: dashboardName },
        }).then((response) => {
            if (response.data?.response.uid) {
                setDashboardId(String(response.data.response.uid))
            }
        })
    }, [dashboardName, trigger])

    // Edit dashboard
    const handleEdit = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'update',
            id: dashboardId,
            data: { name: dashboardName },
        })
    }, [dashboardId, dashboardName, trigger])

    // Delete dashboard
    const handleDelete = useCallback(() => {
        trigger({
            resource: 'dashboards',
            type: 'delete',
            id: dashboardId,
        }).then(() => {
            setDashboardId('')
            setDashboardName('')
        })
    }, [dashboardId, trigger])

    return (
        <div>
            <input
                name="name"
                placeholder="Dashboard Name"
                value={dashboardName}
                onChange={handleNameChange}
                disabled={isLoading}
            />
            {!dashboardId ? (
                <button
                    onClick={handleCreate}
                    disabled={isLoading || !dashboardName}
                >
                    Create
                </button>
            ) : (
                <>
                    <button
                        onClick={handleEdit}
                        disabled={isLoading || !dashboardName}
                    >
                        Edit
                    </button>
                    <button onClick={handleDelete} disabled={isLoading}>
                        Delete
                    </button>
                </>
            )}
            <div>
                {isLoading && <p>Loading...</p>}
                {isSuccess && dashboardId && (
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                )}
                {isError && (
                    <p style={{ color: 'red' }}>{error?.message || 'Error'}</p>
                )}
            </div>
        </div>
    )
}
