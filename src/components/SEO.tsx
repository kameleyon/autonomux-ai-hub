import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const BASE_URL = "https://autonomux.lovable.app";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export const SEO = ({
  title = "Autonomux — AI Agents Marketplace | Automate Anything, No Code",
  description = "Browse, deploy, and run AI agents that automate emails, blog writing, lead generation, and more. Start free — 25 credits, no credit card required.",
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = "website",
}: SEOProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content={type} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={image} />
  </Helmet>
);
