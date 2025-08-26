"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner, FormLoadingState } from "@/components/ui/loading-states";
import { MFAErrorBoundary } from "@/components/error-handling/auth-error-boundary";
import { validateForm, mfaSetupSchema } from "@/lib/utils/form-validation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function MFASetupModal({ isOpen, onClose, onComplete }: MFASetupModalProps) {
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup'>('method');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentMethodId, setCurrentMethodId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleMethodSelect = async (method: string) => {
    if (method === 'totp') {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        // Call API to generate TOTP secret and QR code
        const response = await fetch('/api/auth/mfa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            method_type: 'totp',
            method_name: 'Authenticator App'
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setQrCodeUrl(data.qrCode);
          setManualSecret(data.secret || '');
          setCurrentMethodId(data.method?.id || '');
          setStep('setup');
          setSuccess('MFA setup initialized successfully');
        } else {
          setError(data.error || 'Failed to initialize MFA setup');
        }
      } catch (error) {
        console.error('Failed to setup MFA:', error);
        setError(
          error instanceof Error 
            ? error.message 
            : 'Network error occurred. Please check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerification = async () => {
    // Validate verification code
    const validation = validateForm(mfaSetupSchema, { verificationCode });
    if (!validation.success) {
      setValidationErrors(validation.fieldErrors || {});
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: verificationCode,
          methodId: currentMethodId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep('backup');
        setSuccess('MFA verification successful');
      } else {
        setError(data.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Network error occurred. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    // Reset state
    setStep('method');
    setVerificationCode('');
    setBackupCodesSaved(false);
    setQrCodeUrl('');
    setManualSecret('');
    setBackupCodes([]);
    setCurrentMethodId('');
    setError(null);
    setSuccess(null);
    setValidationErrors({});
  };

  const resetModal = () => {
    setStep('method');
    setVerificationCode('');
    setBackupCodesSaved(false);
    setQrCodeUrl('');
    setManualSecret('');
    setBackupCodes([]);
    setCurrentMethodId('');
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing during operations
    resetModal();
    onClose();
  };

  return (
    <MFAErrorBoundary>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" data-testid="mfa-setup-modal">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          </DialogHeader>

          <FormLoadingState loading={loading} error={error} success={success}>

            {step === 'method' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Choose your preferred two-factor authentication method:
                </p>
                <Button
                  onClick={() => handleMethodSelect('totp')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Setting up...' : 'Authenticator App'}
                </Button>
              </div>
            )}

            {step === 'setup' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Scan the QR code with your authenticator app or enter the secret manually:
                </p>
                
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-100 border rounded flex items-center justify-center" data-testid="qr-code">
                    {qrCodeUrl ? (
                      <Image 
                        src={qrCodeUrl} 
                        alt="QR Code for MFA setup" 
                        width={192}
                        height={192}
                        className="w-full h-full"
                        onError={() => setError('Failed to load QR code. Please use the manual secret below.')}
                      />
                    ) : (
                      <div className="text-center">
                        <LoadingSpinner size="md" />
                        <p className="text-xs text-gray-500 mt-2">Loading QR Code...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Secret */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-600 mb-2">Manual entry key:</p>
                    <code className="text-sm bg-gray-100 p-2 rounded block break-all" data-testid="manual-secret">
                      {manualSecret || 'Loading...'}
                    </code>
                  </CardContent>
                </Card>

                <Button 
                  onClick={() => setStep('verify')} 
                  className="w-full"
                  disabled={!qrCodeUrl || !manualSecret}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 'verify' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app:
                </p>
                
                <div className="space-y-2">
                  <Input
                    name="verificationCode"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      // Clear validation errors when user starts typing
                      if (validationErrors.verificationCode) {
                        setValidationErrors(prev => ({ ...prev, verificationCode: '' }));
                      }
                    }}
                    maxLength={6}
                    className={`text-center text-lg tracking-widest ${
                      validationErrors.verificationCode ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.verificationCode && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.verificationCode}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleVerification}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Verifying...' : 'Verify and Enable'}
                </Button>
              </div>
            )}

            {step === 'backup' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">MFA Successfully Enabled!</span>
                </div>
                
                <p className="text-sm text-gray-600">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device:
                </p>
                
                <Card>
                  <CardContent className="p-4" data-testid="backup-codes">
                    {backupCodes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="bg-gray-100 p-2 rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <LoadingSpinner size="sm" />
                        <p className="text-sm text-gray-500 mt-2">Generating backup codes...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="backupCodesSaved"
                    id="backupCodesSaved"
                    checked={backupCodesSaved}
                    onChange={(e) => setBackupCodesSaved(e.target.checked)}
                    disabled={backupCodes.length === 0}
                  />
                  <label htmlFor="backupCodesSaved" className="text-sm">
                    I have saved these backup codes in a safe place
                  </label>
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={!backupCodesSaved || backupCodes.length === 0}
                  className="w-full"
                >
                  Complete Setup
                </Button>
              </div>
            )}
          </FormLoadingState>
        </DialogContent>
      </Dialog>
    </MFAErrorBoundary>
  );
}