'use client';
import { useEffect, useState } from 'react';
import { ApiKeyErrorBoundary } from '@/components/error-handling/auth-error-boundary';
import { LoadingSpinner, TableLoadingState, FormLoadingState } from '@/components/ui/loading-states';
import { validateForm, apiKeySchema } from '@/lib/utils/form-validation';
import { AlertCircle, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  key_name: string;
  created_at: string;
  is_active: boolean;
  revoked_at?: string;
  user_id: string;
  user_email?: string;
  permissions?: {
    assets: {
      read: boolean;
      write: boolean;
    };
  };
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editingKeyName, setEditingKeyName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const [permissions, setPermissions] = useState({
    assets: {
      read: false,
      write: false
    }
  });

  async function fetchKeys() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/settings/api-keys');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load API keys. Please refresh the page and try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleCreate() {
    // Validate form data
    const validation = validateForm(apiKeySchema, {
      name: newKeyName,
      permissions: permissions
    });
    
    if (!validation.success) {
      setValidationErrors(validation.fieldErrors || {});
      return;
    }
    
    setCreating(true);
    setError(null);
    setSuccess(null);
    setNewKey(null);
    setValidationErrors({});
    
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newKeyName,
          permissions: permissions
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.apiKey) {
        setNewKey(data.apiKey);
        setSuccess('API key created successfully!');
        setShowCreateForm(false);
        setNewKeyName('');
        setPermissions({ assets: { read: false, write: false } });
        await fetchKeys();
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Network error occurred. Please check your connection and try again.'
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      const res = await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSuccess('API key revoked successfully');
      await fetchKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to revoke API key. Please try again.'
      );
    }
  }

  async function handleRename(id: string) {
    if (!editingKeyName.trim()) {
      setError('API key name cannot be empty');
      return;
    }
    
    setRenaming(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingKeyName }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSuccess('API key renamed successfully');
      setEditingKeyId(null);
      setEditingKeyName('');
      await fetchKeys();
    } catch (error) {
      console.error('Failed to rename API key:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to rename API key. Please try again.'
      );
    } finally {
      setRenaming(false);
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('API key copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <ApiKeyErrorBoundary>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">API Keys</h1>
        
        {/* Success Message */}
        {success && (
          <div className="success-message mb-4 p-3 bg-green-100 border border-green-400 rounded text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* API Key Display */}
        {newKey && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <strong>API Key Created Successfully!</strong>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Copy this key now - it will only be shown once for security reasons.
            </p>
            <div className="flex items-center gap-2">
              <div 
                className="font-mono break-all text-sm flex-1 p-2 bg-white border rounded" 
                data-testid="api-key-value"
              >
                {showApiKey ? newKey : '•'.repeat(newKey.length)}
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-gray-500 hover:text-gray-700"
                title={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="p-2 text-blue-600 hover:text-blue-800"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          {!showCreateForm ? (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={() => setShowCreateForm(true)}
              disabled={loading}
            >
              Create API Key
            </button>
          ) : (
            <FormLoadingState loading={creating} error={null} success={null}>
              <div className="border rounded p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Key Name</label>
                  <input
                    name="keyName"
                    className={`w-full border px-3 py-2 rounded ${
                      validationErrors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="Key name (e.g. CI/CD, Zapier)"
                    value={newKeyName}
                    onChange={e => {
                      setNewKeyName(e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    disabled={creating}
                  />
                  {validationErrors.name && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.name}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.assets.read"
                        checked={permissions.assets.read}
                        onChange={e => {
                          setPermissions(prev => ({
                            ...prev,
                            assets: { ...prev.assets, read: e.target.checked }
                          }));
                          if (validationErrors.permissions) {
                            setValidationErrors(prev => ({ ...prev, permissions: '' }));
                          }
                        }}
                        className="mr-2"
                        disabled={creating}
                      />
                      Assets - Read
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="permissions.assets.write"
                        checked={permissions.assets.write}
                        onChange={e => {
                          setPermissions(prev => ({
                            ...prev,
                            assets: { ...prev.assets, write: e.target.checked }
                          }));
                          if (validationErrors.permissions) {
                            setValidationErrors(prev => ({ ...prev, permissions: '' }));
                          }
                        }}
                        className="mr-2"
                        disabled={creating}
                      />
                      Assets - Write
                    </label>
                  </div>
                  {validationErrors.permissions && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.permissions}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-700 flex items-center gap-2"
                    onClick={handleCreate}
                    disabled={creating || !newKeyName.trim()}
                  >
                    {creating && <LoadingSpinner size="sm" />}
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewKeyName('');
                      setPermissions({ assets: { read: false, write: false } });
                      setError(null);
                      setValidationErrors({});
                    }}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </FormLoadingState>
          )}
        </div>

        <TableLoadingState
          loading={loading}
          error={loading ? null : error}
          empty={!loading && apiKeys.length === 0}
          emptyMessage="No API keys found. Create your first API key to get started."
          columns={5}
        >
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Permissions</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(key => (
                <tr key={key.id} className={!key.is_active ? 'opacity-50' : ''}>
                  <td className="p-2">{key.key_name}</td>
                  <td className="p-2">{new Date(key.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    {key.permissions ? (
                      <div className="text-xs">
                        {key.permissions.assets?.read && <span className="bg-blue-100 px-1 py-0.5 rounded mr-1">Read</span>}
                        {key.permissions.assets?.write && <span className="bg-green-100 px-1 py-0.5 rounded">Write</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400">Legacy</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      key.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {key.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="p-2">
                    {key.is_active && (
                      <>
                        <button
                          className="text-red-600 underline mr-2 hover:text-red-800 disabled:opacity-50"
                          onClick={() => handleRevoke(key.id)}
                          disabled={renaming}
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
                              className="text-blue-600 underline mr-1 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
                              onClick={() => handleRename(key.id)}
                              disabled={renaming || !editingKeyName.trim()}
                            >
                              {renaming && <LoadingSpinner size="sm" />}
                              {renaming ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              className="text-gray-600 underline hover:text-gray-800 disabled:opacity-50"
                              onClick={() => { 
                                setEditingKeyId(null); 
                                setEditingKeyName(''); 
                                setError(null);
                              }}
                              disabled={renaming}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
                            onClick={() => { 
                              setEditingKeyId(key.id); 
                              setEditingKeyName(key.key_name); 
                              setError(null);
                            }}
                            disabled={renaming}
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
        </TableLoadingState>
      </div>
    </ApiKeyErrorBoundary>
  );
} 