import { useState } from "react";
import { Menu, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const navLinks = [
  { href: "#home", label: "Hjem" },
  { href: "#portfolio", label: "Portefølje" },
  { href: "#reports", label: "Rapporter" },
  { href: "#guidelines", label: "Retningslinjer" },
  { href: "#team", label: "Medlemmer" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isHomePage && navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
            {!isHomePage && (
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Hjem
              </Link>
            )}
            <Link
              to="/konkurranse"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Trophy className="w-4 h-4" />
              Konkurranse
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            {isHomePage && navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
            {!isHomePage && (
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Hjem
              </Link>
            )}
            <Link
              to="/konkurranse"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Konkurranse
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
