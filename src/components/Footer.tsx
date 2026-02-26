import { Link } from "react-router-dom";
import { Twitter, Linkedin, Github, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

type FooterLink = { label: string; href: string | null };

const footerSections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Pricing", href: "/pricing" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Changelog", href: null },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: null },
      { label: "API Reference", href: null },
      { label: "Blog", href: null },
      { label: "Community", href: null },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: null },
      { label: "Careers", href: null },
      { label: "Contact", href: null },
      { label: "Partners", href: null },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: null },
      { label: "Terms of Service", href: null },
      { label: "Cookie Policy", href: null },
      { label: "Security", href: null },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Github, label: "GitHub" },
  { icon: Youtube, label: "YouTube" },
];

const Footer = () => {
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Autonomux" className="w-7 h-7" />
              <span className="text-gradient text-lg font-medium font-display">
                Autonomux
              </span>
            </Link>
            <p className="text-sm text-sidebar-foreground/60 leading-relaxed">
              Your AI Workforce, One Click Away. Deploy intelligent agents to
              automate any workflow.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-medium mb-4 text-sidebar-foreground/90">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        to={link.href}
                        className="text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-sidebar-foreground/30 cursor-default">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-sidebar-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sidebar-foreground/40">
            © {new Date().getFullYear()} Autonomux. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, label }) => (
              <span
                key={label}
                aria-label={label}
                className="text-sidebar-foreground/30 cursor-default"
              >
                <Icon size={18} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
