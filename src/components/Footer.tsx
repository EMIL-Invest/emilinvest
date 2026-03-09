import eiLogo from "@/assets/ei

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={emilLogo} aliEMIL Invest" className="h-8 w-auto" />
            <span className="font-serif font-semibold text-foreground text-sm">
              EMIL Invest
            </span>
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
