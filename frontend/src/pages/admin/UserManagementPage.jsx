import React, { useState, useEffect } from 'react'
import { getToken } from '../../contexts/AuthContext'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Modal from '../../components/ui/Modal.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'https://siddha-organics.onrender.com'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, fullName }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/users`, { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setUsers(data)
    } catch {
      showToast('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const getUserId = (user) => user._id || user.id

  const handleSuspend = async (userId) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => getUserId(u) === userId ? { ...u, status: 'suspended' } : u))
        showToast('User suspended successfully.')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to suspend user.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (userId) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/reactivate`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => getUserId(u) === userId ? { ...u, status: 'active' } : u))
        showToast('User reactivated successfully.')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to reactivate user.')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClick = (user) => {
    setDeleteTarget({ id: getUserId(user), fullName: user.fullName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    try {
      const res = await fetch(`${API_URL}/api/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => getUserId(u) !== deleteTarget.id))
        showToast('User deleted successfully.')
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to delete user.')
      }
    } finally {
      setActionLoading(null)
      setDeleteTarget(null)
    }
  }

  const handleDeleteCancel = () => setDeleteTarget(null)

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-gray-800 mb-6">Users</h1>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green text-cream px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          ✓ {toast}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={handleDeleteCancel} title="Delete User">
        <div className="p-4">
          <p className="text-gray-700 mb-2">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-gray-900">{deleteTarget?.fullName}</span>?
          </p>
          <p className="text-sm text-red-600 mb-6">
            ⚠️ This action is irreversible. All data for this user will be permanently removed.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteCancel}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleDeleteConfirm}
              disabled={!!actionLoading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {actionLoading ? 'Deleting…' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users…</div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          heading="No users yet"
          description="Registered users will appear here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const uid = getUserId(user)
                return (
                  <tr key={uid} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{user.phone}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.status === 'active' || user.status === 'pending_verification' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={actionLoading === uid}
                            onClick={() => handleSuspend(uid)}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoading === uid}
                            onClick={() => handleReactivate(uid)}
                          >
                            Reactivate
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          disabled={!!actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
