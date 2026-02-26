import { useState, useMemo } from "react";
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
import {
  Star, Search, Rocket, Mail, BarChart2, Headphones, Database,
  FileText, Share2, Mic, Eye, PenTool, Filter, X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  mail: Mail, search: Search, "pen-tool": PenTool, "share-2": Share2,
  headphones: Headphones, database: Database, "file-text": FileText,
  "bar-chart-2": BarChart2, mic: Mic, eye: Eye,
};

const allCategories = ["Marketing", "Sales", "Support", "Data", "Content", "Email", "Social Media", "Productivity", "Finance"];

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [showFilters, setShowFilters] = useState(false);

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
    if (sortBy === "popular") list.sort((a, b) => (b.total_deployments ?? 0) - (a.total_deployments ?? 0));
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "price") list.sort((a, b) => a.base_credit_cost - b.base_credit_cost);
    else if (sortBy === "rating") list.sort((a, b) => Number(b.rating) - Number(a.rating));
    return list;
  }, [agents, searchTerm, selectedCategories, sortBy]);

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
          <button onClick={() => setSelectedCategories([])} className="text-xs text-primary hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2">
        {allCategories.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedCategories.includes(cat)}
              onCheckedChange={() => toggleCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium font-display mb-2">Agent Marketplace</h1>
          <p className="text-muted-foreground">Browse and deploy AI agents for any task</p>
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
                  const Icon = iconMap[agent.icon_url ?? ""] ?? Rocket;
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
                          <div className="flex gap-2">
                            <Badge variant="accent">{agent.category}</Badge>
                            <Badge variant="secondary">{agent.base_credit_cost} credits</Badge>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">{agent.total_deployments} deployments</span>
                            <span className="text-xs text-accent flex items-center gap-1">Deploy <Rocket size={12} /></span>
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
