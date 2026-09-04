// «navy»-tonen peker nå på de grønne variantene - profilfargen er
// logo-grønn (#3B563F) etter redesignet. Prop-navnet beholdes for
// bakoverkompatibilitet: navy = mørk (lys bakgrunn), white = lys (mørk bakgrunn).
import wordmarkNavy from "@/assets/logo-wordmark-green.png";
import wordmarkWhite from "@/assets/logo-wordmark-white.png";
import eiNavy from "@/assets/logo-ei-green.png";
import eiWhite from "@/assets/logo-ei-white.png";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  /** wordmark = «EMIL INVEST» med pil, icon = EI-monogrammet. Brukes aldri sammen. */
  variant?: "wordmark" | "icon";
  /** navy for lys bakgrunn, white for mørk bakgrunn */
  tone?: "navy" | "white";
  className?: string;
}

const wordmarkHeights = { sm: "h-6", md: "h-8", lg: "h-12 md:h-14", xl: "h-16 md:h-24" };
const iconHeights = { sm: "h-8", md: "h-10", lg: "h-16", xl: "h-24" };

const BrandLogo = ({ size = "md", variant = "wordmark", tone = "navy", className = "" }: BrandLogoProps) => {
  const src =
    variant === "icon"
      ? tone === "white" ? eiWhite : eiNavy
      : tone === "white" ? wordmarkWhite : wordmarkNavy;
  const height = variant === "icon" ? iconHeights[size] : wordmarkHeights[size];

  return (
    <img
      src={src}
      alt="EMIL Invest"
      className={`${height} w-auto select-none ${className}`}
      draggable={false}
    />
  );
};

export default BrandLogo;
