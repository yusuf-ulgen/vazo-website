import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { useWishlist } from '@/shared/stores/wishlist-store';
import { useCart } from '@/shared/stores/cart-store';
import { productRepository } from '@/entities/product/api/product-repository';
import { Product } from '@/entities/product/types';
import { Container } from '@/shared/ui/Container';
import { ProductCard } from '@/site/components/ProductCard';

export function WishlistPage() {
  const { items: wishlistIds, clear: clearWishlist } = useWishlist();
  const { addItem } = useCart();

  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productRepository.getProducts().then((allProducts) => {
      const matched = allProducts.filter((p) => wishlistIds.includes(p.id));
      setWishlistProducts(matched);
      setLoading(false);
    });
  }, [wishlistIds]);

  const handleAddAllToCart = () => {
    wishlistProducts.forEach((p) => {
      addItem(p, p.variants[0], 1);
    });
  };

  return (
    <div className="w-full bg-canvas-default min-h-screen py-10 md:py-16">
      <Container size="lg">
        {/* Header */}
        <div className="space-y-3 mb-8 border-b border-border-subtle pb-6 text-left">
          <nav className="text-xs text-text-muted flex items-center gap-1.5 font-sans">
            <Link to="/" className="hover:text-text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Favorilerim</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-text-primary">
                Favori Listem
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 font-sans">
                Beğendiğiniz vazo modellerini kaydedin, dilediğiniz an inceleyin veya sepete aktarın.
              </p>
            </div>

            {wishlistProducts.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-5 py-2.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Tümünü Sepete Ekle</span>
                </button>

                <button
                  type="button"
                  onClick={clearWishlist}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-feedback-danger p-2 border border-border-subtle transition-colors"
                  title="Listeyi Temizle"
                  aria-label="Tüm Favorileri Temizle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
        ) : wishlistProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 bg-surface-muted mx-auto flex items-center justify-center text-text-muted">
              <Heart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-2xl text-text-primary">Favori Listeniz Henüz Boş</h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Koleksiyonlarımızdaki modellerin üzerindeki kalp ikonuna tıklayarak beğendiğiniz parçaları listenize ekleyebilirsiniz.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-action-primary text-action-primary-text px-8 py-3.5 text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Koleksiyonu Keşfet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                aspectRatio="portrait"
                showWholesaleBadge
              />
            ))}
          </div>
        )}

        {/* Feature info strip */}
        <div className="mt-16 p-6 bg-surface-secondary border border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-text-secondary shrink-0" />
            <span className="text-text-secondary">
              Favorileriniz cihazınızda güvenle saklanır. Üyelik sistemi aktifleştiğinde otomatik olarak hesabınızla eşitlenecektir.
            </span>
          </div>
          <Link
            to="/products"
            className="font-medium text-text-primary hover:underline shrink-0"
          >
            Alışverişe Devam Et →
          </Link>
        </div>
      </Container>
    </div>
  );
}
