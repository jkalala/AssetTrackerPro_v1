import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-gray-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed">
                  We collect information you provide directly to us, such as when you create an account, add assets to
                  your inventory, or contact us for support.
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>Account information (email, name)</li>
                  <li>Asset data and QR code information</li>
                  <li>Usage analytics and performance data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use the information we collect to provide, maintain, and improve our services:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  <li>To provide and maintain AssetTracker Pro services</li>
                  <li>To process transactions and send related information</li>
                  <li>To send technical notices and support messages</li>
                  <li>To improve our services and develop new features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your
                  consent, except as described in this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate security measures to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your information for as long as your account is active or as needed to provide services. You
                  may request deletion of your data at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
                <p className="text-gray-700 leading-relaxed">
                  You have the right to access, update, or delete your personal information. Contact us if you wish to
                  exercise these rights.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us through our support channels.
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
