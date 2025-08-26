"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import MFASetupModal from "@/components/auth/mfa-setup-modal";

export default function SecuritySettingsPage() {
  const { user, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) setError(error.message);
      else setSuccess("Password updated successfully.");
    } catch (err) {
      setError("Failed to update password.");
    } finally {
      setLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOutAll = async () => {
    setLoading(true);
    try {
      await signOut();
      window.location.href = "/login";
    } catch {
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const checkMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      const data = await response.json();
      setMfaEnabled(data.enabled || false);
    } catch (error) {
      console.error('Failed to check MFA status:', error);
    }
  };

  const handleMFAComplete = () => {
    setMfaEnabled(true);
    setSuccess("Two-factor authentication has been enabled successfully!");
  };

  useEffect(() => {
    if (user) {
      checkMFAStatus();
    }
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Security Settings</h1>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Change Password"}
            </Button>
            {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </form>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account
                </p>
                <div className="mt-2">
                  <span className="text-sm font-medium">Status: </span>
                  <span 
                    className={`text-sm ${mfaEnabled ? 'text-green-600' : 'text-gray-500'}`}
                    data-testid="mfa-status"
                  >
                    {mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              {!mfaEnabled && (
                <Button onClick={() => setShowMFAModal(true)}>
                  Enable Two-Factor Authentication
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions/Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-gray-700">Current session:</div>
            <div className="text-xs text-gray-500">User ID: {user?.id}</div>
            <div className="text-xs text-gray-500">Email: {user?.email}</div>
          </div>
          <Button variant="outline" onClick={handleSignOutAll} disabled={loading}>
            Sign out of all devices
          </Button>
        </CardContent>
      </Card>

      {/* MFA Setup Modal */}
      <MFASetupModal
        isOpen={showMFAModal}
        onClose={() => setShowMFAModal(false)}
        onComplete={handleMFAComplete}
      />
    </div>
  );
} 