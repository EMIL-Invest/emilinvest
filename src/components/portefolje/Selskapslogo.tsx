import { useState } from "react";
import { logoUrl } from "@/lib/selskapslogoer";
import { visTicker } from "@/lib/utils";

/**
 * Rund hvit brikke med selskapets logo. Finnes ingen logo (eller tjenesten
 * bare har et lite standardikon), vises forbokstaven i serif i stedet.
 */
const Selskapslogo = ({
  ticker,
  navn,
  storrelse = 40,
  className = "",
}: {
  ticker: string;
  navn: string;
  storrelse?: number;
  className?: string;
}) => {
  const url = logoUrl(visTicker(ticker));
  const [feilet, setFeilet] = useState(false);
  const visBilde = url && !feilet;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white shrink-0 overflow-hidden ${className}`}
      style={{ width: storrelse, height: storrelse, boxShadow: "0 1px 2px hsl(153 18% 17% / 0.18)" }}
      aria-hidden="true"
    >
      {visBilde ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          width={Math.round(storrelse * 0.62)}
          height={Math.round(storrelse * 0.62)}
          style={{ width: "62%", height: "62%", objectFit: "contain" }}
          // Tjenesten svarer med en 16 px globus når den ikke finner noe
          onLoad={(e) => e.currentTarget.naturalWidth <= 16 && setFeilet(true)}
          onError={() => setFeilet(true)}
        />
      ) : (
        <span className="font-serif text-band leading-none" style={{ fontSize: storrelse * 0.46 }}>
          {navn.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
};

export default Selskapslogo;
