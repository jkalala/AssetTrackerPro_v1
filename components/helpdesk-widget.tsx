import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function HelpdeskWidget() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message })
    });
    if (res.ok) {
      setSuccess(true);
      setEmail("");
      setMessage("");
    } else {
      setError("Failed to submit ticket. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-6 py-3 text-lg"
        style={{ background: "var(--branding-primary, #2563eb)", color: "white" }}
        onClick={() => setOpen(true)}
      >
        Help
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Need Help?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Contact support or check our <Link href="/docs/faq" className="underline text-blue-600">FAQ</Link>.</p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Textarea
                placeholder="How can we help you?"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={4}
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Submit Ticket"}
              </Button>
              {success && <div className="text-green-600 text-sm">Ticket submitted! We'll get back to you soon.</div>}
              {error && <div className="text-red-600 text-sm">{error}</div>}
            </form>
            <div className="text-xs text-gray-500">For urgent issues, email <a href="mailto:support@example.com" className="underline">support@example.com</a></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 