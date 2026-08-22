import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { productRepository } from '@/entities/product/api/product-repository';
import { Product, ProductVariant } from '@/entities/product/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';
import { ProductGallery } from '@/site/components/pdp/ProductGallery';
import { ProductPurchasePanel } from '@/site/components/pdp/ProductPurchasePanel';
import { ProductStoryHighlights } from '@/site/components/pdp/ProductStoryHighlights';
import { ProductInspirationGrid } from '@/site/components/pdp/ProductInspirationGrid';
import { ProductAccordions } from '@/site/components/pdp/ProductAccordions';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    productRepository
      .getProductBySlug(slug)
      .then(async (prod) => {
        if (!isMounted) return;
        if (!prod) {
          setError('Ürün bulunamadı.');
          setLoading(false);
          return;
        }

        setProduct(prod);
        const defaultRetailVariant = prod.variants.find((v) => v.isAvailableForRetail) || prod.variants[0];
        setSelectedVariant(defaultRetailVariant);

        // Load related products (up to 5 for reference-04)
        const allProds = await productRepository.getProducts();
        if (!isMounted) return;
        setRelatedProducts(allProds.filter((p) => p.id !== prod.id).slice(0, 5));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Ürün bilgisi yüklenirken bir hata oluştu.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full bg-canvas-default min-h-screen py-16">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
            <div className="lg:col-span-7 aspect-[4/5] bg-surface-muted" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-6 bg-surface-muted w-1/3" />
              <div className="h-10 bg-surface-muted w-3/4" />
              <div className="h-8 bg-surface-muted w-1/4" />
              <div className="h-32 bg-surface-muted w-full" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full bg-canvas-default min-h-screen py-24 text-center">
        <Container size="sm" className="space-y-4">
          <div className="w-12 h-12 bg-surface-muted mx-auto flex items-center justify-center text-text-muted">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary">
            {error || 'Aradığınız Ürün Bulunamadı'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            İlgili ürün kaldırılmış veya bağlantı adresi değişmiş olabilir.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <span>Tüm Kataloğu Gör</span>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 border border-border-strong text-text-primary px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-surface-secondary transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Yenile</span>
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="w-full bg-canvas-default min-h-screen">
      {/* Main PDP Grid (Reference 04) */}
      <Container size="lg" className="py-6 sm:py-8 lg:py-10">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans mb-6 text-left">
          <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
          <span>&gt;</span>
          <Link to="/products" className="hover:text-text-primary transition-colors">Vazolar</Link>
          <span>&gt;</span>
          <span className="text-text-primary font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery (7 cols) */}
          <div className="lg:col-span-7">
            <ProductGallery
              media={product.images}
              productName={product.name}
            />
          </div>

          {/* Right Column: Sticky Purchase & Wholesale Panel (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ProductPurchasePanel
              product={product}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
            />
          </div>
        </div>
      </Container>

      {/* 3 Key Value Props Strip (Reference 04) */}
      <ProductStoryHighlights
        storyText={product.description}
        materialText={product.material}
      />

      {/* Usage Inspiration 4-Photo Gallery (Reference 04) */}
      <ProductInspirationGrid productName={product.name} />

      {/* Technical Accordions (Reference 04) */}
      <ProductAccordions />

      {/* Related Products 5-Column Grid (Reference 04) */}
      {relatedProducts.length > 0 && (
        <section className="w-full bg-canvas-default py-12 md:py-16">
          <Container size="lg">
            <div className="text-left mb-6">
              <h2 className="font-sans text-xs uppercase font-semibold tracking-wider text-text-primary">
                BENZER ÜRÜNLER
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  aspectRatio="square"
                  showWholesaleBadge={false}
                />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
