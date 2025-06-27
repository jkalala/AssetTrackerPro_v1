"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ExternalLink, Copy, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function SupabaseSetupGuide() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((n) => n !== stepNumber) : [...prev, stepNumber],
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const steps = [
    {
      id: 1,
      title: "Open Supabase Dashboard",
      description: "Navigate to your project's authentication settings",
      action: "https://app.supabase.com/project/wyqohljdnrouovuqqdlt/auth/url-configuration",
      actionText: "Open Dashboard",
    },
    {
      id: 2,
      title: "Set Site URL",
      description: "Update the main site URL for your application",
      copyText: "https://cloudeleavepro.vercel.app",
      instruction: "In the 'Site URL' field, enter:",
    },
    {
      id: 3,
      title: "Add Redirect URLs",
      description: "Configure allowed redirect URLs for authentication",
      copyTexts: [
        "https://cloudeleavepro.vercel.app/auth/callback",
        "https://cloudeleavepro.vercel.app/auth/reset-password",
        "https://cloudeleavepro.vercel.app/**",
      ],
      instruction: "In the 'Redirect URLs' section, add these URLs (one per line):",
    },
    {
      id: 4,
      title: "Save Configuration",
      description: "Apply the changes to your Supabase project",
      instruction: "Click 'Save' to apply all URL configuration changes",
    },
    {
      id: 5,
      title: "Test Signup Flow",
      description: "Verify that confirmation emails now redirect correctly",
      action: "/signup",
      actionText: "Test Signup",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Supabase URL Configuration Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Follow these steps to fix the localhost redirect issue in signup confirmation emails.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <Button
                    variant={completedSteps.includes(step.id) ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 rounded-full p-0"
                    onClick={() => toggleStep(step.id)}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{step.id}</span>
                    )}
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    {completedSteps.includes(step.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{step.description}</p>

                  {step.instruction && <p className="text-sm font-medium text-blue-600">{step.instruction}</p>}

                  {step.copyText && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <code className="flex-1 text-sm">{step.copyText}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(step.copyText!)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {step.copyTexts && (
                    <div className="space-y-1">
                      {step.copyTexts.map((text, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                          <code className="flex-1 text-sm">{text}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(text)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.action && (
                    <Button variant="outline" size="sm" asChild className="mt-2">
                      <a
                        href={step.action}
                        target={step.action.startsWith("http") ? "_blank" : "_self"}
                        rel={step.action.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-2"
                      >
                        {step.actionText}
                        {step.action.startsWith("http") && <ExternalLink className="h-4 w-4" />}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">After Completion</h4>
                <p className="text-sm text-green-700 mt-1">
                  Once you've completed all steps, signup confirmation emails will redirect to{" "}
                  <code className="bg-green-100 px-1 rounded">https://cloudeleavepro.vercel.app</code> instead of
                  localhost.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
