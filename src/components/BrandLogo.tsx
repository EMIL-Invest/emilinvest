interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { text: "text-sm tracking-[0.15em]", line: "mt-0.5" },
  md: { text: "text-lg tracking-[0.15em]", line: "mt-1" },
  lg: { text: "text-3xl md:text-4xl tracking-[0.15em]", line: "mt-1.5" },
  xl: { text: "text-5xl md:text-7xl tracking-[0.15em]", line: "mt-2" },
};

const BrandLogo = ({ size = "md", className = "" }: BrandLogoProps) => {
  const s = sizeMap[size];
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <span className={`font-serif font-bold text-foreground ${s.text}`}>
        EMIL INVEST
      </span>
      <div className={`w-full h-px bg-foreground/80 ${s.line}`} />
    </div>
  );
};

export default BrandLogo;
