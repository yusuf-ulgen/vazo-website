import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productRepository } from '@/entities/product/api/product-repository';
import { Product } from '@/entities/product/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '../ProductCard';

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productRepository.getProducts().then((data) => {
      setProducts(data.slice(0, 6));
      setLoading(false);
    });
  }, []);

  return (
    <section className="w-full bg-canvas-default py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-14 border-b border-border-subtle pb-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Öne Çıkan Seçki
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal text-text-primary mt-1">
              Çok Satan Vazo Modelleri
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wide text-text-primary hover:text-text-secondary transition-colors group"
          >
            <span>Tüm Ürünleri Gör</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Grid (6 columns desktop) */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-surface-muted" />
                <div className="h-4 bg-surface-muted w-3/4" />
                <div className="h-3 bg-surface-muted w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                aspectRatio="portrait"
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
