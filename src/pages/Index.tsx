import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Search, PenTool, Star, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const agentCards = [
  { name: "Email Auto-Responder", icon: Mail, rating: 4.8 },
  { name: "Lead Scraper Pro", icon: Search, rating: 4.6 },
  { name: "Blog Writer", icon: PenTool, rating: 4.9 },
];

const Index = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-medium font-display tracking-tight">
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
          <h2 className="text-2xl font-medium font-display">Buttons</h2>
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
          <h2 className="text-2xl font-medium font-display">Badges</h2>
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
          <h2 className="text-2xl font-medium font-display">Agent Card Preview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {agentCards.map(({ name, icon: Icon, rating }) => (
              <Card key={name} className="cursor-pointer hover:-translate-y-0.5">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                      <Icon size={24} />
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star size={14} fill="hsl(var(--accent))" stroke="none" className="shadow-sm" />
                      {rating}
                    </span>
                  </div>
                  <h3 className="font-medium text-lg">{name}</h3>
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
