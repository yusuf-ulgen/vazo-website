import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/entities/product/types';
import { mockApiAdapter } from '@/shared/api/mock-adapter';
import { ProductCard } from '@/site/components/ProductCard';

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'bestseller'>('all');

  useEffect(() => {
    mockApiAdapter.getProducts().then((data) => {
      setProducts(data);
    });
  }, []);

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'new') return p.isNewArrival;
    if (activeTab === 'bestseller') return p.isBestseller;
    return true;
  });

  return (
    <section className="py-20 bg-surface-primary border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-border-subtle">
          <div>
            <span className="text-xs uppercase tracking-editorial font-semibold text-text-secondary block mb-2">
              Seçkiler
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-text-primary">
              Öne Çıkan Formlar & Vazolar
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wide font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 text-xs uppercase tracking-wide font-medium transition-colors ${
                activeTab === 'new'
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Yeni Gelenler
            </button>
            <button
              onClick={() => setActiveTab('bestseller')}
              className={`px-4 py-2 text-xs uppercase tracking-wide font-medium transition-colors ${
                activeTab === 'bestseller'
                  ? 'bg-action-primary text-action-primary-text'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Çok Satanlar
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-primary hover:opacity-75 transition-opacity border-b border-text-primary pb-1"
          >
            <span>Tüm Kataloğu İncele (Perakende & Toptan)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
