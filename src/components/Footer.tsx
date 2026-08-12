import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const Footer = () => {
  return (
    <footer className="py-14 bg-primary text-primary-foreground">
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <BrandLogo variant="icon" tone="white" size="md" />
            <p className="text-sm text-primary-foreground/70 max-w-xs text-center md:text-left">
              Investeringskomiteen i EMIL — Energi- og miljøingeniørenes
              linjeforening, NTNU.
            </p>
            {/* Kontaktpunkt. Samme adresse som i personvernerklæringen. */}
            <a
              href="mailto:kontakt@emilinvest.no"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground underline underline-offset-2 transition-colors"
            >
              kontakt@emilinvest.no
            </a>
          </div>

          <div className="text-center">
            <p className="text-sm text-primary-foreground/60 mb-2">
              © {new Date().getFullYear()} EMIL Invest. Alle rettigheter reservert.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <Link
                to="/personvern"
                className="text-primary-foreground/70 hover:text-primary-foreground underline underline-offset-2 transition-colors"
              >
                Personvern
              </Link>
              <Link
                to="/vilkar"
                className="text-primary-foreground/70 hover:text-primary-foreground underline underline-offset-2 transition-colors"
              >
                Vilkår
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            <a
              href="https://live.euronext.com/nb/markets/oslo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Oslo Børs
            </a>
            <a
              href="https://emilntnu.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              EMIL
            </a>
            <a
              href="https://www.instagram.com/emil_invest_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
