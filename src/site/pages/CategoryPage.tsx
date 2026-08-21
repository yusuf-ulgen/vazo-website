import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, ArrowUpDown } from 'lucide-react';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { productRepository } from '@/entities/product/api/product-repository';
import { Category } from '@/entities/category/types';
import { Product } from '@/entities/product/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'newest'>('recommended');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setLoading(true);
    setError(null);

    categoryRepository
      .getCategoryBySlug(slug)
      .then(async (cat) => {
        if (!isMounted) return;
        if (!cat) {
          setError('Kategori bulunamadı.');
          setLoading(false);
          return;
        }
        setCategory(cat);

        const prods = await productRepository.getProducts({
          categoryId: cat.id,
          sortBy,
        });
        if (!isMounted) return;
        setProducts(prods);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Kategori yüklenirken bir hata oluştu.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, sortBy]);

  return (
    <div className="w-full bg-canvas-default min-h-screen">
      {/* Category Hero Banner */}
      <div className="relative w-full bg-canvas-warm border-b border-border-subtle overflow-hidden">
        <Container size="lg" className="py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4 text-left">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tüm Kataloğa Dön</span>
              </Link>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                {category?.name || 'Kategori'}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed font-sans">
                {category?.description || 'Özel tasarım el işçiliği vazo seçkisi.'}
              </p>
            </div>

            {category?.imageUrl && (
              <div className="md:col-span-4">
                <div className="aspect-[4/3] w-full overflow-hidden bg-surface-secondary shadow-card">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Main Grid Area */}
      <Container size="lg" className="py-12 md:py-16">
        {/* Sort & Count Bar */}
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-border-subtle pb-4 text-xs">
          <span className="text-text-secondary">
            {loading ? 'Yükleniyor...' : `${products.length} Model Listeleniyor`}
          </span>

          <div className="flex items-center gap-1.5 bg-surface-primary border border-border-default px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent text-text-primary focus:outline-none text-xs"
              aria-label="Sıralama"
            >
              <option value="recommended">Önerilen Sıralama</option>
              <option value="newest">En Yeni Gelenler</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            </select>
          </div>
        </div>

        {/* State Display */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-surface-muted" />
                <div className="h-4 bg-surface-muted w-3/4" />
                <div className="h-3 bg-surface-muted w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <p className="font-display text-xl text-feedback-danger">{error}</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold"
            >
              <span>Kataloğa Dön</span>
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-text-muted mx-auto" />
            <p className="font-display text-xl text-text-primary">Bu kategoride ürün bulunmuyor</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold"
            >
              <span>Diğer Kategorileri İncele</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                aspectRatio="portrait"
                showWholesaleBadge
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
