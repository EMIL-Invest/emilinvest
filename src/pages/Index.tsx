import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PortfolioSection from "@/components/PortfolioSection";
import PerformanceSection from "@/components/PerformanceSection";
import CompetitionBanner from "@/components/CompetitionBanner";
import ReportsSection from "@/components/ReportsSection";
import GuidelinesSection from "@/components/GuidelinesSection";
import TeamSection from "@/components/TeamSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <PortfolioSection />
      <PerformanceSection />
      <CompetitionBanner />
      <ReportsSection />
      <GuidelinesSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default Index;
