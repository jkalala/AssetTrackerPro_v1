"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Asset, getAsset } from "@/lib/asset-actions";

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    status: "active",
    location: "",
    purchase_value: "",
    purchase_date: "",
    manufacturer: "",
    model: "",
    serial_number: "",
    warranty_expiry: "",
    notes: ""
  });

  useEffect(() => {
    if (!authLoading && user && assetId) {
      fetchAsset();
    }
    // eslint-disable-next-line
  }, [user, authLoading, assetId]);

  const fetchAsset = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAsset(assetId);
      if (result.error) {
        setError(result.error);
        toast({
          title: "Error Loading Asset",
          description: result.error,
          variant: "destructive"
        });
      } else {
        setAsset(result.data);
        setForm({
          name: result.data.name || "",
          description: result.data.description || "",
          category: result.data.category || "",
          status: result.data.status || "active",
          location: result.data.location || "",
          purchase_value: result.data.purchase_value?.toString() || "",
          purchase_date: result.data.purchase_date || "",
          manufacturer: result.data.manufacturer || "",
          model: result.data.model || "",
          serial_number: result.data.serial_number || "",
          warranty_expiry: result.data.warranty_expiry || "",
          notes: result.data.notes || ""
        });
      }
    } catch (e) {
      setError("Failed to load asset");
      toast({
        title: "Error Loading Asset",
        description: "An unexpected error occurred while loading the asset",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          purchase_value: form.purchase_value ? Number(form.purchase_value) : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update asset");
        toast({
          title: "Update Failed",
          description: data.error || "Failed to update asset",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Asset Updated",
          description: "The asset has been updated successfully."
        });
        router.push(`/asset/${assetId}`);
      }
    } catch (e) {
      setError("Failed to update asset");
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred while updating the asset",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!asset) return <div className="p-8">Asset not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" name="name" placeholder="Asset Name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <Input id="description" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
              <Input id="category" name="category" placeholder="Category" value={form.category} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
              <Input id="status" name="status" placeholder="Status" value={form.status} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
              <Input id="location" name="location" placeholder="Location" value={form.location} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="purchase_value" className="block text-sm font-medium mb-1">Purchase Value</label>
              <Input id="purchase_value" name="purchase_value" placeholder="Purchase Value" value={form.purchase_value} onChange={handleChange} type="number" />
            </div>
            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium mb-1">Purchase Date</label>
              <Input id="purchase_date" name="purchase_date" placeholder="YYYY-MM-DD" value={form.purchase_date} onChange={handleChange} type="date" />
            </div>
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">Manufacturer</label>
              <Input id="manufacturer" name="manufacturer" placeholder="Manufacturer" value={form.manufacturer} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">Model</label>
              <Input id="model" name="model" placeholder="Model" value={form.model} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium mb-1">Serial Number</label>
              <Input id="serial_number" name="serial_number" placeholder="Serial Number" value={form.serial_number} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="warranty_expiry" className="block text-sm font-medium mb-1">Warranty Expiry</label>
              <Input id="warranty_expiry" name="warranty_expiry" placeholder="YYYY-MM-DD" value={form.warranty_expiry} onChange={handleChange} type="date" />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
              <Input id="notes" name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 