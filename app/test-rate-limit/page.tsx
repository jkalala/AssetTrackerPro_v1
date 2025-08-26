import { RateLimitDemo } from "@/components/examples/rate-limit-demo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestRateLimitPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rate Limiting Test</h1>
        <p className="text-muted-foreground">
          Test the rate limiting functionality and see how the UI handles rate limit errors.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Rate Limiting Works</CardTitle>
          <CardDescription>
            This application implements rate limiting to prevent abuse and ensure fair usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Rate Limit Headers</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><code>X-RateLimit-Limit</code>: Maximum requests allowed</li>
                <li><code>X-RateLimit-Remaining</code>: Requests remaining in window</li>
                <li><code>X-RateLimit-Reset</code>: When the limit resets (timestamp)</li>
                <li><code>Retry-After</code>: Seconds to wait before retrying</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Error Response</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>HTTP Status: <code>429 Too Many Requests</code></li>
                <li>Error message with retry time</li>
                <li>Structured JSON response</li>
                <li>Automatic UI error handling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <RateLimitDemo />
    </div>
  );
}