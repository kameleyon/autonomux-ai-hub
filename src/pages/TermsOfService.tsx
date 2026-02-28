import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

const TermsOfService = () => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <SEO title="Terms of Service | Autonomux" url="https://autonomux.lovable.app/terms" />
    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
      <ArrowLeft size={14} /> Back to Home
    </Link>
    <h1 className="text-3xl font-display font-medium mb-2">Terms of Service</h1>
    <p className="text-sm text-muted-foreground mb-8">Last updated: February 2026</p>
    <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
      <p>By using Autonomux, you agree to these terms.</p>
      <h2 className="text-foreground font-medium text-lg">Service</h2>
      <p>Autonomux provides an AI agents marketplace. Agents run on third-party AI models and results may vary. We do not guarantee specific outcomes.</p>
      <h2 className="text-foreground font-medium text-lg">Credits &amp; Payments</h2>
      <p>Credits are non-refundable except where required by law. Monthly plan credits do not roll over. Purchased credit packs never expire.</p>
      <h2 className="text-foreground font-medium text-lg">Acceptable Use</h2>
      <p>You may not use Autonomux for illegal activities, spam, or to generate harmful content. We reserve the right to suspend accounts that violate these terms.</p>
      <h2 className="text-foreground font-medium text-lg">Limitation of Liability</h2>
      <p>Autonomux is provided &quot;as is&quot;. We are not liable for any damages arising from the use of AI-generated content or agent outputs.</p>
    </div>
  </div>
);

export default TermsOfService;
