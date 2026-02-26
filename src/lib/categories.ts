import { Megaphone, ShoppingCart, Headphones, Database, PenTool, Mail, Share2, Code } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const APP_CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: "Marketing", icon: Megaphone },
  { name: "Sales", icon: ShoppingCart },
  { name: "Support", icon: Headphones },
  { name: "Data", icon: Database },
  { name: "Content", icon: PenTool },
  { name: "Email", icon: Mail },
  { name: "Social Media", icon: Share2 },
  { name: "Development", icon: Code },
];

export const CATEGORY_NAMES = APP_CATEGORIES.map((c) => c.name);
