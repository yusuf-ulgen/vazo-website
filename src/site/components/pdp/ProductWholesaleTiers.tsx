import { Link } from 'react-router-dom';
import { Package, User } from 'lucide-react';
import { WholesalePricingTier } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';

export interface ProductWholesaleTiersProps {
  tiers: WholesalePricingTier[];
  productName: string;
  retailPrice: number;
  productSlug: string;
}

export function ProductWholesaleTiers({
  tiers,
  productName: _productName,
  retailPrice,
  productSlug,
}: ProductWholesaleTiersProps) {
  // If product doesn't have custom tiers defined, generate standard tiers matching reference-04
  const activeTiers: WholesalePricingTier[] = tiers.length > 0
    ? tiers
    : [
        { minQuantity: 6, maxQuantity: 11, unitPrice: Math.round(retailPrice * 0.8), discountPercentage: 20 },
        { minQuantity: 12, maxQuantity: 23, unitPrice: Math.round(retailPrice * 0.75), discountPercentage: 25 },
        { minQuantity: 24, maxQuantity: 49, unitPrice: Math.round(retailPrice * 0.7), discountPercentage: 30 },
        { minQuantity: 50, maxQuantity: undefined, unitPrice: Math.round(retailPrice * 0.6), discountPercentage: 40 },
      ];

  return (
    <div className="border border-border-default bg-surface-secondary/40 p-5 space-y-4 text-left">
      {/* Title & Subtitle (Reference 04) */}
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-primary">
          <Package className="w-3.5 h-3.5 text-text-secondary" />
          <span>Toptan Alım / Wholesale</span>
        </div>
        <p className="text-[11px] text-text-secondary font-sans mt-0.5">
          Toplu alımlarda özel fiyat avantajları
        </p>
      </div>

      {/* Tier Pricing Table (Reference 04) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-border-default text-[10px] uppercase font-semibold text-text-muted">
              <th className="py-2 font-medium">ADET ARALIĞI</th>
              <th className="py-2 font-medium">BİRİM FİYAT</th>
              <th className="py-2 font-medium text-right">İSKONTO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {activeTiers.map((tier, idx) => (
              <tr key={idx} className="hover:bg-surface-primary/50 transition-colors">
                <td className="py-2.5 font-medium text-text-primary">
                  {tier.maxQuantity ? `${tier.minQuantity} – ${tier.maxQuantity} adet` : `${tier.minQuantity}+ adet`}
                </td>
                <td className="py-2.5 text-text-secondary">
                  {tier.unitPrice ? formatCurrency(tier.unitPrice) : 'Özel fiyat'}
                </td>
                <td className="py-2.5 text-right font-medium text-feedback-success">
                  {tier.discountPercentage ? `-%${tier.discountPercentage}` : 'Teklif alınız'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions (Reference 04) */}
      <div className="pt-1 space-y-2.5">
        <Link
          to={`/wholesale/apply?product=${productSlug}`}
          className="w-full inline-flex items-center justify-center border border-border-strong bg-surface-primary hover:bg-neutral-900 hover:text-white text-text-primary py-3 text-xs uppercase font-semibold tracking-wider transition-colors shadow-xs"
        >
          <span>TOPTAN FİYAT AL</span>
        </Link>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          <User className="w-3 h-3" />
          <Link to="/wholesale" className="hover:text-text-primary transition-colors">
            Kurumsal Müşteri / Toptan Girişi
          </Link>
        </div>
      </div>
    </div>
  );
}
