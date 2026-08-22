import { SplitHeroReference03 } from '@/site/components/home/SplitHeroReference03';
import { BestSellersRailReference03 } from '@/site/components/home/BestSellersRailReference03';
import { CommercialBenefitsReference03 } from '@/site/components/home/CommercialBenefitsReference03';

export function HomePage() {
  return (
    <div className="space-y-0">
      {/* 1:1 Match with reference-03-retail-wholesale.png */}
      <SplitHeroReference03 />
      <BestSellersRailReference03 />
      <CommercialBenefitsReference03 />
    </div>
  );
}
