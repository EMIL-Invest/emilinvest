import emilLogo from "@/assets/emil-invest-logo.png";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={emilLogo} alt="EMIL Invest" className="h-8 w-auto" />
            <div>
              <span className="font-serif font-semibold text-foreground text-sm">
                EMIL Invest
              </span>
              <span className="text-xs text-muted-foreground block">
                NTNU Energi & Miljø
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} EMIL Invest NTNU. Alle
            rettigheter reservert.
          </p>

          <div className="flex gap-6">
            <a
              href="https://www.ntnu.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              NTNU
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
