 import { Badge } from "@/components/ui/badge";
 
 const AboutSection = () => {
   return (
     <section id="om-oss" className="py-24 bg-[hsl(210,50%,10%)] text-white">
       <div className="section-container">
         <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
           {/* Left column - Title */}
           <div>
             <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
               Om oss
             </Badge>
             <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight">
               En investeringskomité for{" "}
               <span className="text-primary">studenter</span> ved NTNU
             </h2>
             
             <p className="mt-8 text-white/80 leading-relaxed">
               EMIL Invest er en studentdrevet investeringskomité under linjeforeningen Energi og Miljø ved NTNU. 
               Vi forvalter en reell aksjeportefølje med mål om å slå Oslo Børs (OSEBX) over tid. 
               Komiteen består av 16 engasjerte studenter som brenner for bærekraftige investeringer 
               og økonomisk forståelse.
             </p>
             
             <p className="mt-4 text-white/80 leading-relaxed">
               Vi møtes annenhver uke for å evaluere porteføljen, diskutere markedstrender og 
               presentere aksjeanalyser. Dette gir medlemmene praktisk erfaring med investeringer 
               og et solid grunnlag for videre karriere innen finans og bærekraft.
             </p>
           </div>
           
           {/* Right column - More details */}
           <div className="space-y-6">
             <div>
               <h3 className="text-xl font-serif font-semibold mb-3">Bærekraftig investeringsstrategi</h3>
               <p className="text-white/80 leading-relaxed">
                 Vår tilnærming til bærekraft handler ikke om å utelukkende velge de "grønneste" selskapene, 
                 men om å anvende en grundig ESG-screening. Vi utelukker selskaper som driver virksomhet 
                 i strid med bærekraftig utvikling, som fossil energi, våpen og tobakk. 
                 Målet er en diversifisert portefølje som balanserer avkastning med ansvarlige investeringer.
               </p>
             </div>
             
             <div>
               <h3 className="text-xl font-serif font-semibold mb-3">Læring gjennom praksis</h3>
               <p className="text-white/80 leading-relaxed">
                 For å gi medlemmene verdifull erfaring har vi satt av inntil 5% av porteføljen 
                 til spekulasjonsaksjer. Dette gir rom for å utforske mer risikofylte investeringer 
                 i et kontrollert miljø, noe som bidrar til økt kunnskap om markedsdynamikk og 
                 risikostyring.
               </p>
             </div>
             
             <div>
               <h3 className="text-xl font-serif font-semibold mb-3">Langsiktig perspektiv</h3>
               <p className="text-white/80 leading-relaxed">
                 Vi tror på langsiktig verdiskaping fremfor kortsiktig spekulasjon. 
                 Våre investeringsbeslutninger er basert på grundige analyser og et mål om 
                 å bygge en robust portefølje som tåler markedssvingninger.
               </p>
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 };
 
 export default AboutSection;