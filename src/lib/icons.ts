import {
  Mail, Search, PenTool, Share2, Headphones, Database,
  FileText, BarChart2, Mic, Eye, Rocket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  mail: Mail,
  search: Search,
  "pen-tool": PenTool,
  "share-2": Share2,
  headphones: Headphones,
  database: Database,
  "file-text": FileText,
  "bar-chart-2": BarChart2,
  mic: Mic,
  eye: Eye,
};

export const defaultAgentIcon = Rocket;
