"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { SessionErrorBoundary } from "@/components/error-handling/auth-error-boundary";
import { LoadingSpinner, LoadingState } from "@/components/ui/loading-states";
import { validateForm, sessionSchema } from "@/lib/utils/form-validation";
import { AlertCircle, CheckCircle2, RefreshCw, Shield } from "lucide-react";

interface UserSession {
  id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
  user_agent?: string;
  location?: string;
}

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);

  const fetchSessions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      
      const response = await fetch('/api/auth/sessions');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
        if (isRefresh) {
          setSuccess('Sessions refreshed successfully');
        }
      } else {
        throw new Error(data.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to load sessions. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    // Validate session ID
    const validation = validateForm(sessionSchema, { sessionId });
    if (!validation.success) {
      setError('Invalid session ID');
      return;
    }

    if (!confirm('Are you sure you want to terminate this session? You will be signed out from that device.')) {
      return;
    }

    setTerminatingSession(sessionId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Session terminated successfully');
        // Remove the terminated session from the list
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      } else {
        throw new Error(data.error || 'Failed to terminate session');
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to terminate session. Please try again.'
      );
    } finally {
      setTerminatingSession(null);
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
      return '📱';
    }
    if (info.includes('tablet') || info.includes('ipad')) {
      return '📱';
    }
    return '💻';
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Auto-refresh sessions every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchSessions(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    fetchSessions(true);
  };

  return (
    <SessionErrorBoundary>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

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

        <LoadingState
          loading={loading}
          error={loading ? null : error}
          loadingText="Loading your active sessions..."
        >
          <div className="space-y-4" data-testid="session-list">
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Active Sessions</h3>
                  <p className="text-sm">
                    You don&apos;t have any active sessions. This might indicate a connection issue.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Sessions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className={session.is_current ? 'border-blue-500 bg-blue-50' : ''}
                  data-testid={session.is_current ? "current-session" : "other-session"}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="text-2xl">
                          {getDeviceIcon(session.device_info)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">
                              {session.device_info || 'Unknown Device'}
                            </h3>
                            {session.is_current && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Current Session
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div>IP Address: {session.ip_address}</div>
                            <div>Last Activity: {formatLastActivity(session.last_activity)}</div>
                            <div>Started: {new Date(session.created_at).toLocaleString()}</div>
                            {session.location && (
                              <div>Location: {session.location}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!session.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={terminatingSession === session.id}
                          data-testid="terminate-session"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center gap-2"
                        >
                          {terminatingSession === session.id && <LoadingSpinner size="sm" />}
                          {terminatingSession === session.id ? 'Terminating...' : 'Terminate Session'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </LoadingState>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Session Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Sessions are automatically terminated after 30 days of inactivity</p>
              <p>• You can have up to 10 active sessions at once</p>
              <p>• Suspicious activity will automatically terminate sessions</p>
              <p>• Always sign out from shared or public devices</p>
              <p>• Sessions refresh automatically every 30 seconds</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SessionErrorBoundary>
  );
}