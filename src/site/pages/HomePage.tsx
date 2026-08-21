import { HeroSection } from '@/site/components/home/HeroSection';
import { FeaturedProductsSection } from '@/site/components/home/FeaturedProductsSection';
import { AlternatingEditorialSection } from '@/site/components/home/AlternatingEditorialSection';
import { RetailWholesaleSplitSection } from '@/site/components/home/RetailWholesaleSplitSection';
import { CategoryTilesSection } from '@/site/components/home/CategoryTilesSection';
import { WholesaleBenefitsSection } from '@/site/components/home/WholesaleBenefitsSection';
import { FeaturedCollectionSection } from '@/site/components/home/FeaturedCollectionSection';
import { InspirationStorySection } from '@/site/components/home/InspirationStorySection';
import { NewsletterSection } from '@/site/components/home/NewsletterSection';

export function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <FeaturedProductsSection />
      <AlternatingEditorialSection />
      <RetailWholesaleSplitSection />
      <CategoryTilesSection />
      <WholesaleBenefitsSection />
      <FeaturedCollectionSection />
      <InspirationStorySection />
      <NewsletterSection />
    </div>
  );
}
