import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "/pricing" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("autonomux-theme");
    if (stored) return stored === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("autonomux-theme", dark ? "dark" : "light");
  }, [dark]);

  const handleHowItWorks = () => {
    if (window.location.pathname === "/") {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#how-it-works";
    }
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-sidebar/95 backdrop-blur-md shadow-lg"
          : "bg-sidebar"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Autonomux" className="w-8 h-8" />
            <span className="text-gradient text-xl font-medium font-display">
              Autonomux
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleHowItWorks}
              className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            >
              How It Works
            </button>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            {user ? (
              <>
                <NotificationBell />
                <Button variant="gradient" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut size={18} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  asChild
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button variant="gradient" size="sm" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-sidebar border-t border-sidebar-border animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileOpen(false); handleHowItWorks(); }}
              className="block text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2 w-full text-left"
            >
              How It Works
            </button>
            <div className="pt-3 border-t border-sidebar-border flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <NotificationBell />
                    <span className="text-sm text-sidebar-foreground/70">Notifications</span>
                  </div>
                  <Button variant="gradient" asChild>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start text-sidebar-foreground/70"
                    onClick={async () => { setMobileOpen(false); await signOut(); navigate("/"); }}
                  >
                    <LogOut size={16} className="mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    asChild
                  >
                    <Link to="/signin" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button variant="gradient" asChild>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
