"use client"
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_OPTIONS = [
  "asset.created",
  "asset.updated",
  "asset.deleted",
];

export default function WebhookManagementPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ url: string; events: string[]; secret: string }>({ url: "", events: [], secret: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    const res = await fetch("/api/webhooks");
    const data = await res.json();
    setWebhooks(data.webhooks || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEventChange = (event: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e: string) => e !== event)
        : [...f.events, event],
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/webhooks/${editingId}` : "/api/webhooks";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save webhook");
      return;
    }
    setForm({ url: "", events: [], secret: "" });
    setEditingId(null);
    fetchWebhooks();
  };

  const handleEdit = (wh: any) => {
    setForm({ url: wh.url, events: wh.events, secret: wh.secret || "" });
    setEditingId(wh.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    fetchWebhooks();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Webhook" : "Register New Webhook"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Webhook URL</label>
              <Input name="url" value={form.url} onChange={handleChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium">Events</label>
              <div className="flex gap-4">
                {EVENT_OPTIONS.map((event) => (
                  <label key={event} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={form.events.includes(event)}
                      onChange={() => handleEventChange(event)}
                    />
                    {event}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Secret (optional)</label>
              <Input name="secret" value={form.secret} onChange={handleChange} />
            </div>
            {error && <div className="text-red-600">{error}</div>}
            <Button type="submit">{editingId ? "Update Webhook" : "Register Webhook"}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ url: "", events: [], secret: "" }); }}>Cancel</Button>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Registered Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : webhooks.length === 0 ? (
            <div>No webhooks registered.</div>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  <th className="p-2 border">URL</th>
                  <th className="p-2 border">Events</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((wh) => (
                  <tr key={wh.id}>
                    <td className="p-2 border break-all">{wh.url}</td>
                    <td className="p-2 border">{wh.events.join(", ")}</td>
                    <td className="p-2 border">{wh.status}</td>
                    <td className="p-2 border space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(wh)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(wh.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 