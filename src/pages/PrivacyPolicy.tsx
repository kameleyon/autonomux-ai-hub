import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
      <ArrowLeft size={14} /> Back to Home
    </Link>
    <h1 className="text-3xl font-display font-medium mb-2">Privacy Policy</h1>
    <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>
    <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
      <p>Autonomux (&quot;we&quot;, &quot;our&quot;) respects your privacy. This policy describes how we collect, use, and protect your information.</p>
      <h2 className="text-foreground font-medium text-lg">Information We Collect</h2>
      <p>We collect your email address, name, and payment information when you create an account and purchase credits. We also collect usage data about how you interact with our AI agents.</p>
      <h2 className="text-foreground font-medium text-lg">How We Use Your Data</h2>
      <p>Your data is used to provide the Autonomux service, process payments, and improve our AI agents. We do not sell your personal data to third parties.</p>
      <h2 className="text-foreground font-medium text-lg">Credentials &amp; Security</h2>
      <p>API keys and credentials you provide are encrypted using AES-256-GCM before storage. We never store credentials in plain text.</p>
      <h2 className="text-foreground font-medium text-lg">Contact</h2>
      <p>For privacy questions, contact us at privacy@autonomux.com.</p>
    </div>
  </div>
);

export default PrivacyPolicy;
