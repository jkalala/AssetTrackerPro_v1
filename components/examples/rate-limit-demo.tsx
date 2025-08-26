"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { RateLimitError } from "../ui/rate-limit-error";
import { useRateLimit } from "../../hooks/use-rate-limit";
import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

export function RateLimitDemo() {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const rateLimit = useRateLimit();

  const makeRequest = async (endpoint: string = "/api/test-rate-limit") => {
    if (!rateLimit.canRetry) {
      return;
    }

    setLoading(true);
    try {
      const response = await rateLimit.wrappedFetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      setResponses(prev => [{
        timestamp: new Date().toISOString(),
        status: response.status,
        data,
        headers: {
          'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
          'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
          'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
        }
      }, ...prev.slice(0, 9)]);
      
    } catch (error) {
      console.error("Request failed:", error);
      setResponses(prev => [{
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const clearResponses = () => {
    setResponses([]);
    rateLimit.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate Limit Demo
          </CardTitle>
          <CardDescription>
            Test the rate limiting functionality by making multiple requests quickly.
            The endpoint allows 10 requests per minute.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rateLimit.isRateLimited && (
            <RateLimitError 
              retryAfter={rateLimit.retryAfter}
              onRetry={() => rateLimit.reset()}
            />
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => makeRequest()}
              disabled={loading || !rateLimit.canRetry}
            >
              {loading ? "Making Request..." : "Make Request"}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearResponses}
            >
              Clear History
            </Button>
          </div>

          {rateLimit.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Rate Limited</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {rateLimit.error.message}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span>Limit: {rateLimit.error.limit}</span>
                <span>Remaining: {rateLimit.error.remaining}</span>
                <span>Retry in: {rateLimit.retryAfter}s</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>
              Recent API requests and their responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responses.map((response, index) => (
                <div 
                  key={index}
                  className="p-3 border rounded-md bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {response.status === 200 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : response.status === 429 ? (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge variant={
                        response.status === 200 ? "default" :
                        response.status === 429 ? "secondary" : "destructive"
                      }>
                        {response.status === 'error' ? 'ERROR' : response.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(response.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {response.headers && (
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted-foreground">Limit:</span>{" "}
                        {response.headers['X-RateLimit-Limit'] || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>{" "}
                        {response.headers['X-RateLimit-Remaining'] || 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reset:</span>{" "}
                        {response.headers['X-RateLimit-Reset'] ? 
                          new Date(parseInt(response.headers['X-RateLimit-Reset'])).toLocaleTimeString() : 
                          'N/A'
                        }
                      </div>
                    </div>
                  )}
                  
                  {response.data && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                  
                  {response.error && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      {response.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}