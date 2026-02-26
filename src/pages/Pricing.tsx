import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: 0,
    credits: 25,
    features: ["3 active agents", "25 credits/mo", "Community support", "Basic analytics"],
  },
  {
    name: "Pro",
    price: 29,
    credits: 200,
    popular: true,
    features: ["Unlimited agents", "200 credits/mo", "Priority support", "Advanced analytics", "Custom schedules"],
  },
  {
    name: "Business",
    price: 99,
    credits: 1000,
    features: ["Unlimited agents", "1,000 credits/mo", "API access", "Priority support", "SSO", "Dedicated account manager"],
  },
];

const faqs = [
  { q: "What are credits?", a: "Credits are the currency used to run AI agents. Each agent run consumes a set number of credits based on its complexity." },
  { q: "Can I change plans anytime?", a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately." },
  { q: "What happens when I run out of credits?", a: "Your agents will pause until you purchase more credits or your monthly allocation renews." },
  { q: "Do unused credits roll over?", a: "Monthly credits do not roll over. Purchased credit packs never expire." },
  { q: "Is there a free trial for Pro?", a: "Every account starts with 25 free credits. You can upgrade to Pro anytime to unlock more features." },
  { q: "Can I get a refund?", a: "We offer a 14-day money-back guarantee on all paid plans." },
];

const Pricing = () => {
  return (
    <div className="bg-background animate-fade-in">
      {/* Header */}
      <section className="py-16 lg:py-24 text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <Badge variant="accent" className="mb-2">Pricing</Badge>
          <h1 className="text-3xl lg:text-5xl font-medium font-display">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground text-lg">Start free. Scale when you're ready.</p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all hover:-translate-y-0.5 ${
                plan.popular ? "ring-2 ring-accent shadow-lg scale-[1.02]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <Badge variant="accent" className="rounded-none rounded-bl-lg px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-medium font-display">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-medium">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.credits} credits/month</p>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={16} className="text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="gradient" className="w-full" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center mt-8 text-sm text-muted-foreground">
          Need more credits? <Link to="/dashboard/billing" className="text-primary hover:underline">Buy credit packs →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="bg-secondary/30 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-medium font-display text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
