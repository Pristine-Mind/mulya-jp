import Navigation from './components/layout/Navigation';
import HeroSection from './components/sections/HeroSection';
import FeaturesSection from './components/sections/FeaturesSection';
import SupplyChainSection from './components/sections/SupplyChainSection';
import RegistrationSection from './components/sections/RegistrationSection';
import Footer from './components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SupplyChainSection />
        <RegistrationSection />
      </main>
      <Footer />
    </div>
  );
}
