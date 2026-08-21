import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowUpDown, X, Sparkles, RefreshCcw } from 'lucide-react';
import { productRepository, ProductFilterOptions } from '@/entities/product/api/product-repository';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { Product } from '@/entities/product/types';
import { Category } from '@/entities/category/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';
import { useWishlist } from '@/shared/stores/wishlist-store';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items: wishlistIds } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Active filters from URL
  const selectedCategory = searchParams.get('category') || '';
  const selectedMaterial = searchParams.get('material') || '';
  const selectedSort = (searchParams.get('sort') || 'recommended') as ProductFilterOptions['sortBy'];
  const filterParam = searchParams.get('filter'); // 'new', 'bestseller', 'wishlist'

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (!value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      productRepository.getProducts({
        categoryId: selectedCategory || undefined,
        isNewArrival: filterParam === 'new' ? true : undefined,
        isBestseller: filterParam === 'bestseller' ? true : undefined,
        sortBy: selectedSort,
      }),
      categoryRepository.getCategories(),
    ])
      .then(([prods, cats]) => {
        if (!isMounted) return;
        setProducts(prods);
        setCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Ürünler yüklenirken bir sorun oluştu.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, filterParam, selectedSort]);

  // Client-side additional filtering (materials, wishlist)
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (filterParam === 'wishlist') {
      list = list.filter((p) => wishlistIds.includes(p.id));
    }

    if (selectedMaterial) {
      list = list.filter((p) =>
        p.material.toLowerCase().includes(selectedMaterial.toLowerCase())
      );
    }

    return list;
  }, [products, filterParam, wishlistIds, selectedMaterial]);

  // Unique materials for filter dropdown
  const materials = ['Stoneware', 'Seramik', 'Doğal Bazalt Kili', 'Doğal Kırmızı Kil', 'Porselen'];

  const getPageTitle = () => {
    if (filterParam === 'wishlist') return 'Favorilerim';
    if (filterParam === 'new') return 'Yeni Gelenler';
    if (filterParam === 'bestseller') return 'Çok Satan Vazo Modelleri';
    if (selectedCategory) {
      const cat = categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);
      if (cat) return cat.name;
    }
    return 'Tüm Vazo Koleksiyonu';
  };

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 md:py-16">
      <Container size="lg">
        {/* Breadcrumb & Header */}
        <div className="space-y-3 mb-8 border-b border-border-subtle pb-6 text-left">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">{getPageTitle()}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                {getPageTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl font-sans">
                El işçiliği stoneware, terakota ve mineral mat dokulu heykelsi vazo tasarımları.
              </p>
            </div>

            <div className="text-xs text-text-muted font-sans shrink-0">
              {loading ? 'Yükleniyor...' : `${filteredProducts.length} Ürün Listeleniyor`}
            </div>
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 mb-8 bg-surface-secondary px-4 border border-border-subtle text-xs">
          {/* Quick Categories Bar */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <button
              onClick={() => updateParam('category', null)}
              className={`px-3 py-1.5 border transition-colors ${
                !selectedCategory
                  ? 'bg-action-primary text-action-primary-text border-action-primary'
                  : 'bg-surface-primary text-text-primary border-border-default hover:border-text-primary'
              }`}
            >
              Tümü
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateParam('category', selectedCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 border transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-action-primary text-action-primary-text border-action-primary'
                    : 'bg-surface-primary text-text-primary border-border-default hover:border-text-primary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Material & Sort Controls */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Material Filter */}
            <select
              value={selectedMaterial}
              onChange={(e) => updateParam('material', e.target.value || null)}
              className="bg-surface-primary text-text-primary border border-border-default px-3 py-1.5 focus:outline-none text-xs"
              aria-label="Materyale göre filtrele"
            >
              <option value="">Tüm Materyaller</option>
              {materials.map((mat) => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-surface-primary border border-border-default px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
              <select
                value={selectedSort || 'recommended'}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-transparent text-text-primary focus:outline-none text-xs"
                aria-label="Sıralama seçeneği"
              >
                <option value="recommended">Önerilen Sıralama</option>
                <option value="newest">En Yeni Gelenler</option>
                <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content State Handling */}
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="aspect-[3/4] bg-surface-muted" />
                <div className="h-4 bg-surface-muted w-3/4" />
                <div className="h-3 bg-surface-muted w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <p className="font-display text-xl text-feedback-danger">Katalog Yüklenemedi</p>
            <p className="text-xs text-text-secondary">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Yeniden Dene</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 bg-surface-muted mx-auto flex items-center justify-center text-text-muted">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl text-text-primary">Eşleşen Ürün Bulunamadı</h3>
            <p className="text-xs text-text-secondary">
              Seçilen filtre kriterlerine uygun model bulunamadı. Filtreleri temizleyerek tüm kataloğu görüntüleyebilirsiniz.
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-6 py-3 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          </div>
        ) : (
          /* 4-Column Product Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
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
