import { HeroSection } from '@/site/features/home/HeroSection';
import { FeaturedProductsSection } from '@/site/features/home/FeaturedProductsSection';
import { EditorialStorySection } from '@/site/features/home/EditorialStorySection';
import { WholesaleBenefitsSection } from '@/site/features/home/WholesaleBenefitsSection';

export function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturedProductsSection />
      <EditorialStorySection />
      <WholesaleBenefitsSection />
    </div>
  );
}
