import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
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
      {/* Konkurransen rett etter toppen — saldo → bilde → konkurranse */}
      <CompetitionBanner />
      <AboutSection />
      <PortfolioSection />
      <PerformanceSection />
      <ReportsSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default Index;
