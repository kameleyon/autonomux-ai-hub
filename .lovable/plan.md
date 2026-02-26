

# Autonomux — Full Implementation Plan

## Phase 1: Design System & Color Theme
- Update CSS variables in `src/index.css` for both light and dark modes with the Autonomux brand palette:
  - Primary Red `#E81E25`, Primary Orange `#F7941D`, gradient CTAs
  - Light mode: background `#FAFAFA`, text `#1E1E2E`
  - Dark mode: background `#0F0F1A`, surfaces `#1A1A2E` / `#1E1E32`, text `#F5F5F5`, muted `#9CA3AF`, borders `#2D2D44`
  - Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`
- Update `tailwind.config.ts` with gradient utilities, semantic colors, updated border radii (12-16px cards, 8px buttons)
- Add Montserrat font family
- Add gradient button variant to `button.tsx`, `accent` badge variant, orange focus rings on inputs, `rounded-xl` cards
- Add utility classes: `.btn-gradient`, gradient text, accent tag styles

## Phase 2: Supabase Database Setup
- Create tables with RLS enabled:
  - **profiles** (id, display_name, avatar_url, plan_tier, credits_balance, created_at, updated_at) — auto-created on signup via trigger
  - **user_roles** (id, user_id, role enum) — separate table for security
  - **agents** (id, name, slug, description, long_description, category, icon_url, creator_id, is_published, base_credit_cost, config_schema, required_credentials, rating, total_deployments, version, timestamps)
  - **deployments** (id, user_id, agent_id, config, status, schedule, timestamps)
  - **user_credentials** (id, user_id, credential_type, encrypted_value, created_at)
  - **runs** (id, deployment_id, status, credits_used, input/output summaries, error_message, timestamps)
  - **transactions** (id, user_id, type, amount_cents, credits, stripe_id, created_at)
- RLS policies: users access only their own data; agents readable by all authenticated users
- Seed 10 placeholder agents

## Phase 3: Shared Layout Components
- **Dark sticky navbar**: Logo placeholder (🦎) + "Autonomux" gradient text, nav links (Marketplace, Pricing, How It Works), Sign In ghost button + Get Started gradient CTA, blur effect on scroll
- **Dark footer**: 4-column layout (Product, Resources, Company, Legal), copyright + social icons
- **Mobile responsive**: hamburger menu on mobile

## Phase 4: Authentication (Sign In / Sign Up)
- **Sign Up** (`/signup`): Centered card on light bg, fields (Full Name, Email, Password), gradient submit, Google OAuth, link to sign in
- **Sign In** (`/signin`): Email + Password, forgot password link, gradient submit, Google OAuth
- **Password Reset**: Forgot password page + `/reset-password` page with new password form
- Supabase Auth integration with `onAuthStateChange`, protected route wrapper
- Auto-create profile on signup with 25 free credits, 'free' tier

## Phase 5: Landing / Home Page
- **Dark hero** (85vh): "Your AI Workforce, One Click Away" headline, subtitle, two CTAs (Explore Agents + Watch Demo), glowing agent card mockup with red-orange box-shadow, trust stats bar (500+ Agents, 10,000+ Tasks, 99.9% Uptime)
- **How It Works** (light bg): 3 horizontal steps — Browse, Configure, Deploy — with gradient number circles and icons
- **Featured Agents** (light bg): Grid of agent cards from Supabase with "View All →" link
- **Categories** (white bg): 6-8 category cards (Marketing, Sales, Support, Data, Content, Email, Social Media, Development) with icons, names, agent count badges, orange border hover
- **CTA Banner** (dark bg): "Ready to automate?" with gradient button
- Animations: gradient shimmer on hero CTA, card hover lifts, fade-in on scroll

## Phase 6: Marketplace Page (`/marketplace`)
- **Top bar**: Full-width search input + sort dropdown (Most Popular, Newest, Price)
- **Left sidebar** (desktop): Category checkboxes, credit cost filter, clear filters — collapses to top filter bar on mobile
- **Agent card grid**: 3-col desktop / 2-col tablet / 1-col mobile
- **Agent card**: White rounded-xl card with icon (48x48), name, star rating, 2-line description, category pill (orange accent), credit cost pill, "Deploy →" link, creator name, hover lift + shadow
- Data fetched from Supabase agents table with filtering/search

## Phase 7: Agent Detail Page (`/marketplace/:slug`)
- **Top section**: Back link, large agent icon, name, rating + review count, creator + verified badge, category pills, gradient "Deploy This Agent" CTA + credit cost
- **Left column (65%)**: Tabs — Overview (description, use cases, example output), Configuration preview, Reviews (placeholder)
- **Right sidebar (35%)**: Details card (category, cost, run time, success rate, deployments, last updated), Requirements card (credentials with lock icons), repeated deploy button

## Phase 8: Deploy Wizard (`/deploy/:agentId`)
- Auth required — redirect to sign in if not logged in
- **3-step progress indicator**
- **Step 1 — Configure**: Dynamic form from agent's `config_schema` (dropdowns, sliders, text inputs)
- **Step 2 — Connect Credentials**: Masked inputs for each required credential, security notice, "How to get this" help links
- **Step 3 — Review & Deploy**: Summary card, terms checkbox, gradient deploy button
- **Success state**: Checkmark animation, "Your agent is live!", link to dashboard
- Creates deployment record + saves credentials in Supabase

## Phase 9: User Dashboard (`/dashboard`)
- **Sidebar** (dark `#1A1A2E`): User avatar + name, nav links (Overview, My Agents, Run History, Billing, Credentials, Settings) — becomes bottom tab bar on mobile
- **Overview**: 4 stat cards with count-up animation (Active Agents, Total Runs, Credits Remaining, Success Rate), recent activity feed, "Deploy New Agent" button
- **My Agents**: Table of deployed agents with status pills (Active green / Paused yellow / Error red), last run, total runs, credits used, actions (Pause, Configure, Delete)
- **Run History**: Filterable table with status pills (Queued gray, Running blue, Success green, Failed red), expandable output
- **Billing**: Current plan card, "Buy Credits" → modal with 3 credit packs ($10/100cr, $45/500cr, $160/2000cr) as selectable cards, transaction history table
- **Credentials**: List with masked values + last used date, add/delete credential modals with confirmation

## Phase 10: Pricing Page (`/pricing`)
- **3-tier cards**: Free ($0/mo, 25cr, 3 agents), Pro ($29/mo, 200cr, unlimited, "Most Popular" badge + gradient border, elevated), Business ($99/mo, 1000cr, API access, priority support)
- Each with gradient "Get Started" CTA
- "Need more credits?" link to credit packs
- FAQ accordion (5-6 questions) at bottom

## Phase 11: Animations & Polish
- Page transition fade-ins
- Card hover: translateY(-2px) + shadow increase
- CTA buttons: scale(1.02) on hover
- Hero gradient CTA: subtle shimmer/pulse
- Dashboard stats: count-up animation on load
- Deploy success: confetti or checkmark animation
- Responsive refinements across all breakpoints

