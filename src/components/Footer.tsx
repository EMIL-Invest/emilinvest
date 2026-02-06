import BrandLogo from "@/components/BrandLogo";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center">
            <BrandLogo className="h-6 w-auto" />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} EMIL Invest. Alle rettigheter reservert.
          </p>

          <div className="flex gap-6">
            <a
              href="https://www.oslobors.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Oslo Børs
            </a>
            <a
              href="https://www.oslobors.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Oslo Børs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
