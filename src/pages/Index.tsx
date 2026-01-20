import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PortfolioSection from "@/components/PortfolioSection";
import GuidelinesSection from "@/components/GuidelinesSection";
import TeamSection from "@/components/TeamSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PortfolioSection />
      <GuidelinesSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default Index;
