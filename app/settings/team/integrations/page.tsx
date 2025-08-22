"use client"
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INTEGRATION_TYPES = [
  { value: "slack", label: "Slack" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "custom", label: "Custom Webhook" },
];

export default function IntegrationManagementPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "slack", webhook_url: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState("");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    const res = await fetch("/api/integrations");
    const data = await res.json();
    setIntegrations(data.integrations || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/integrations/${editingId}` : "/api/integrations";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save integration");
      return;
    }
    setForm({ type: "slack", webhook_url: "" });
    setEditingId(null);
    fetchIntegrations();
  };

  const handleEdit = (integration: any) => {
    setForm({ type: integration.type, webhook_url: integration.webhook_url });
    setEditingId(integration.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this integration?")) return;
    await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    fetchIntegrations();
  };

  const handleTest = async (integration: any) => {
    setTestStatus("Sending...");
    const res = await fetch(integration.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: testMsg || "Test notification from AssetPro" }),
    });
    if (res.ok) setTestStatus("Success!");
    else setTestStatus("Failed to send");
    setTimeout(() => setTestStatus(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Integration" : "Register New Integration"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Integration Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="border rounded px-2 py-1">
                {INTEGRATION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Webhook URL</label>
              <Input name="webhook_url" value={form.webhook_url} onChange={handleChange} required />
            </div>
            {error && <div className="text-red-600">{error}</div>}
            <Button type="submit">{editingId ? "Update Integration" : "Register Integration"}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ type: "slack", webhook_url: "" }); }}>Cancel</Button>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registered Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : integrations.length === 0 ? (
            <div>No integrations registered.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Webhook URL</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td className="p-2 border">{integration.type}</td>
                    <td className="p-2 border break-all">{integration.webhook_url}</td>
                    <td className="p-2 border">{integration.status}</td>
                    <td className="p-2 border space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(integration)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(integration.id)}>Delete</Button>
                      <Button size="sm" variant="secondary" onClick={() => handleTest(integration)}>Test</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4">
            <label className="block mb-1 font-medium">Test Message</label>
            <Input value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Enter a test message..." />
            {testStatus && <div className="mt-2 text-sm text-blue-600">{testStatus}</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 