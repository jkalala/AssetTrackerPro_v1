import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-center text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using AssetTracker Pro, you accept and agree to be bound by the terms and provision
                  of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Use License</h2>
                <p className="text-gray-700 leading-relaxed">
                  Permission is granted to temporarily use AssetTracker Pro for personal and commercial asset management
                  purposes. This is the grant of a license, not a transfer of title.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to
                  accept responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We respect your privacy and are committed to protecting your personal data. Please review our Privacy
                  Policy to understand how we collect, use, and protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Service Availability</h2>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain high availability of our service, but we do not guarantee uninterrupted access.
                  We reserve the right to modify or discontinue the service with reasonable notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us through our support
                  channels.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t">
              <Link href="/" className="text-blue-600 hover:text-blue-500">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
