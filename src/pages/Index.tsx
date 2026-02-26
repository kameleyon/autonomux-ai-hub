import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Preview: Design System Showcase */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold font-display tracking-tight">
            <span className="text-gradient">Autonomux</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI Workforce, One Click Away
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button variant="gradient" size="lg">Get Started</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-display">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="gradient">Gradient</Button>
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-display">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="accent">Marketing</Badge>
            <Badge variant="accent">5 credits</Badge>
            <Badge variant="destructive">Error</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold font-display">Agent Card Preview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {["Email Auto-Responder", "Lead Scraper Pro", "Blog Writer"].map((name) => (
              <Card key={name} className="cursor-pointer hover:-translate-y-0.5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl">
                      🤖
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">⭐ 4.8</span>
                  </div>
                  <h3 className="font-semibold text-lg">{name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Automatically handle tasks with AI-powered automation.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="accent">Marketing</Badge>
                    <Badge variant="secondary">5 credits</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
