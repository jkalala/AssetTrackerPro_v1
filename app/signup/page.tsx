import type { Metadata } from "next"
import SignupClientPage from "./SignupClientPage"

export const metadata: Metadata = {
  title: "Sign Up | AssetTracker Pro",
  description: "Create your AssetTracker Pro account and start managing your assets efficiently.",
}

export default function SignupPage() {
  return <SignupClientPage />
}
