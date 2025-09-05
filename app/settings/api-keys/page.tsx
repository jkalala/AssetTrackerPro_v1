'use client'
import { useEffect, useState } from 'react'

interface ApiKey {
  id: string
  name: string
  created_at: string
  revoked: boolean
  user_id: string
  user_email?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [editingKeyName, setEditingKeyName] = useState('')
  const [renaming, setRenaming] = useState(false)

  async function fetchKeys() {
    const res = await fetch('/api/settings/api-keys')
    const data = await res.json()
    setApiKeys(data.keys || [])
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    setNewKey(null)
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    })
    const data = await res.json()
    setCreating(false)
    if (data.apiKey) {
      setNewKey(data.apiKey)
      fetchKeys()
    } else {
      setError(data.error || 'Failed to create API key')
    }
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' })
    fetchKeys()
  }

  async function handleRename(id: string) {
    setRenaming(true)
    setError(null)
    const res = await fetch(`/api/settings/api-keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingKeyName }),
    })
    setRenaming(false)
    setEditingKeyId(null)
    setEditingKeyName('')
    fetchKeys()
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">API Keys</h1>
      <div className="mb-6">
        <input
          className="border px-2 py-1 mr-2"
          placeholder="Key name (e.g. CI/CD, Zapier)"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
          onClick={handleCreate}
          disabled={creating || !newKeyName}
        >
          {creating ? 'Creating...' : 'Create API Key'}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {newKey && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 rounded">
            <strong>API Key (copy now, only shown once):</strong>
            <div className="font-mono break-all text-sm mt-2">{newKey}</div>
          </div>
        )}
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Created</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map(key => (
            <tr key={key.id} className={key.revoked ? 'opacity-50' : ''}>
              <td className="p-2">{key.name}</td>
              <td className="p-2">{new Date(key.created_at).toLocaleString()}</td>
              <td className="p-2">{key.revoked ? 'Revoked' : 'Active'}</td>
              <td className="p-2">
                {!key.revoked && (
                  <>
                    <button
                      className="text-red-600 underline mr-2"
                      onClick={() => handleRevoke(key.id)}
                    >
                      Revoke
                    </button>
                    {editingKeyId === key.id ? (
                      <>
                        <input
                          className="border px-1 py-0.5 mr-1 text-sm"
                          value={editingKeyName}
                          onChange={e => setEditingKeyName(e.target.value)}
                          disabled={renaming}
                        />
                        <button
                          className="text-blue-600 underline mr-1"
                          onClick={() => handleRename(key.id)}
                          disabled={renaming || !editingKeyName.trim()}
                        >
                          Save
                        </button>
                        <button
                          className="text-gray-600 underline"
                          onClick={() => {
                            setEditingKeyId(null)
                            setEditingKeyName('')
                          }}
                          disabled={renaming}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-blue-600 underline"
                        onClick={() => {
                          setEditingKeyId(key.id)
                          setEditingKeyName(key.name)
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
