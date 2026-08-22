import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowUpDown, ArrowRight, Sparkles } from 'lucide-react';
import { productRepository } from '@/entities/product/api/product-repository';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { Product } from '@/entities/product/types';
import { Category } from '@/entities/category/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';

export function WholesaleProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'newest'>('recommended');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productRepository.getProducts({
        categoryId: selectedCategory || undefined,
        sortBy,
      }),
      categoryRepository.getCategories(),
    ]).then(([prods, cats]) => {
      // Filter products that allow wholesale
      setProducts(prods.filter((p) => p.wholesale.isWholesaleEnabled !== false));
      setCategories(cats);
      setLoading(false);
    });
  }, [selectedCategory, sortBy]);

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 md:py-16">
      <Container size="lg">
        {/* Header */}
        <div className="space-y-3 mb-8 border-b border-border-subtle pb-6 text-left">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link to="/wholesale" className="hover:text-text-primary transition-colors">Toptan</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Toptan Ürün Kataloğu</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-editorial text-text-secondary">
                <Building2 className="w-3.5 h-3.5" />
                <span>Toptan & Kurumsal Koleksiyon</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                Toptan Satışa Uygun Modeller
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary max-w-xl font-sans">
                Tüm modellerimiz için geçerli kademeli toptan fiyatlandırma, MOQ 6 adet ve özel sır opsiyonları.
              </p>
            </div>

            <Link
              to="/wholesale/apply"
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shrink-0 shadow-xs"
            >
              <span>Toplu Fiyat Teklifi Al</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 mb-8 bg-surface-secondary px-4 border border-border-subtle text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 border transition-colors ${
                !selectedCategory
                  ? 'bg-action-primary text-action-primary-text border-action-primary'
                  : 'bg-surface-primary text-text-primary border-border-default'
              }`}
            >
              Tüm Kategoriler
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`px-3 py-1.5 border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-action-primary text-action-primary-text border-action-primary'
                    : 'bg-surface-primary text-text-primary border-border-default'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-surface-primary border border-border-default px-2.5 py-1.5 ml-auto">
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

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-surface-muted" />
                <div className="h-4 bg-surface-muted w-3/4" />
                <div className="h-3 bg-surface-muted w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-text-muted mx-auto" />
            <h3 className="font-display text-xl text-text-primary">Ürün Bulunamadı</h3>
            <p className="text-xs text-text-secondary">
              Seçilen kategoride toptan satışa açık ürün bulunamadı.
            </p>
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
