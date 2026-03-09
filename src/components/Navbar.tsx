import { useState, useEffect } from "react";
import { Menu, X, Trophy, LogIn, LogOut, Shield, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
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
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data && data.length > 0) {
      setIsAdmin(data.some(r => r.role === "admin"));
    } else {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

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
          <Link to="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
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
            
            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Shield className="w-4 h-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/konto">
                  <Button variant="ghost" size="sm">
                    <UserCog className="w-4 h-4 mr-1" />
                    Konto
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logg ut
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  Logg inn
                </Button>
              </Link>
            )}
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
            
            {/* Mobile Auth buttons */}
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Administrasjon
                  </Link>
                )}
                <Link
                  to="/konto"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <UserCog className="w-4 h-4" />
                  Min konto
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logg ut
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Logg inn
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
