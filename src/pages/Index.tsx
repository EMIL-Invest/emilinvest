import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RecruitmentSection from "@/components/RecruitmentSection";
import AboutSection from "@/components/AboutSection";
import PortfolioSection from "@/components/PortfolioSection";
import PerformanceSection from "@/components/PerformanceSection";
import CompetitionBanner from "@/components/CompetitionBanner";
import ReportsSection from "@/components/ReportsSection";
import TeamSection from "@/components/TeamSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      {/* Opptaket ligger rett under toppen mens det er åpent */}
      <RecruitmentSection />
      {/* Konkurransen etter opptaket - saldo → bilde → opptak → konkurranse */}
      <CompetitionBanner />
      <PortfolioSection />
      <PerformanceSection />
      <AboutSection />
      <ReportsSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default Index;
