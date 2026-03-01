import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Search, ArrowRight, Filter, X } from "lucide-react";
import { iconMap, defaultAgentIcon } from "@/lib/icons";
import { CATEGORY_NAMES } from "@/lib/categories";
import { SEO } from "@/components/SEO";

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [creditRange, setCreditRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategories([cat]);
    }
  }, [searchParams]);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["marketplace-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("is_published", true);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = agents ?? [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length > 0) {
      list = list.filter((a) => selectedCategories.includes(a.category));
    }
    if (creditRange !== "all") {
      if (creditRange === "1-5") list = list.filter((a) => a.base_credit_cost >= 1 && a.base_credit_cost <= 5);
      else if (creditRange === "5-15") list = list.filter((a) => a.base_credit_cost > 5 && a.base_credit_cost <= 15);
      else if (creditRange === "15-50") list = list.filter((a) => a.base_credit_cost > 15 && a.base_credit_cost <= 50);
      else if (creditRange === "50+") list = list.filter((a) => a.base_credit_cost > 50);
    }
    list = [...list];
    if (sortBy === "popular") list.sort((a, b) => (b.total_deployments ?? 0) - (a.total_deployments ?? 0));
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "price") list.sort((a, b) => a.base_credit_cost - b.base_credit_cost);
    else if (sortBy === "rating") list.sort((a, b) => Number(b.rating) - Number(a.rating));
    else if (sortBy === "beginner") list.sort((a, b) => {
      const aComplexity = (a.required_credentials?.length ?? 0) * 10 + a.base_credit_cost;
      const bComplexity = (b.required_credentials?.length ?? 0) * 10 + b.base_credit_cost;
      return aComplexity - bComplexity;
    });
    return list;
  }, [agents, searchTerm, selectedCategories, sortBy, creditRange]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Categories</h3>
        {selectedCategories.length > 0 && (
          <button onClick={() => setSelectedCategories([])} className="text-xs text-accent hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2">
        {CATEGORY_NAMES.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedCategories.includes(cat)}
              onCheckedChange={() => toggleCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>

      <div className="space-y-3 mt-6">
        <h3 className="font-medium">Credit Cost</h3>
        <div className="space-y-2">
          {[
            { value: "all", label: "All" },
            { value: "1-5", label: "1-5 credits" },
            { value: "5-15", label: "5-15 credits" },
            { value: "15-50", label: "15-50 credits" },
            { value: "50+", label: "50+ credits" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={creditRange === opt.value}
                onCheckedChange={() => setCreditRange(creditRange === opt.value ? "all" : opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <SEO
        title="AI Agent Marketplace — Browse 10+ Ready-Made AI Workers | Autonomux"
        description="Browse AI agents for email, content, leads, support, social media, development and more. Deploy in seconds, no code required."
        url="https://autonomux.lovable.app/marketplace"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium font-display mb-2">Agent Marketplace</h1>
          <p className="text-muted-foreground">Pick an AI agent, set it up in clicks, and get results in seconds</p>
          <p className="text-xs text-accent mt-1">Every account starts with 25 free credits — no credit card needed</p>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} className="mr-2" />Filters
              {selectedCategories.length > 0 && (
                <Badge variant="accent" className="ml-2">{selectedCategories.length}</Badge>
              )}
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price">Lowest Price</SelectItem>
                <SelectItem value="beginner">Beginner Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile filters */}
        {showFilters && (
          <div className="md:hidden mb-6 p-4 border rounded-xl bg-card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}><X size={18} /></Button>
            </div>
            <FilterPanel />
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <FilterPanel />
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="p-5 h-48" /></Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p>No agents found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((agent) => {
                  const Icon = iconMap[agent.icon_url ?? ""] ?? defaultAgentIcon;
                  return (
                    <Link key={agent.id} to={`/marketplace/${agent.slug}`}>
                      <Card className="cursor-pointer hover:-translate-y-0.5 h-full transition-all">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                              <Icon size={24} />
                            </div>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Star size={14} fill="hsl(var(--accent))" stroke="none" className="shadow-sm" />
                              {Number(agent.rating).toFixed(1)}
                            </span>
                          </div>
                          <h3 className="font-medium text-lg">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                          {(agent as any).example_output && (
                            <p className="text-xs text-accent/80 line-clamp-1">
                              → You get: {(agent as any).example_output}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Badge variant="accent">{agent.category}</Badge>
                            <Badge variant="secondary">~${(agent.base_credit_cost * 0.10).toFixed(2)}/run</Badge>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">{agent.total_deployments} deployments</span>
                            <span className="text-xs text-accent flex items-center gap-1">Get Started <ArrowRight size={12} /></span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
