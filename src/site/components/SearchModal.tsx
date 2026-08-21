import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { productRepository } from '@/entities/product/api/product-repository';
import { Product } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      productRepository.getProducts({ searchQuery: query.trim() }).then((data) => {
        setResults(data);
        setIsSearching(false);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-24">
        <div className="relative w-full max-w-2xl bg-surface-primary shadow-elevated border border-border-default overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Input Bar */}
          <div className="p-4 sm:p-6 border-b border-border-default flex items-center gap-3">
            <Search className="w-5 h-5 text-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Vazo modeli, materyal (stoneware, terakota) veya koleksiyon ara..."
              className="w-full text-base sm:text-lg bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label="Aramayı Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs uppercase font-semibold tracking-wider text-text-secondary hover:text-text-primary px-2 py-1 border border-border-subtle"
            >
              ESC
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
            {isSearching ? (
              <div className="py-8 text-center text-xs text-text-secondary">
                <span>Aranıyor...</span>
              </div>
            ) : query.trim() && results.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="font-display text-lg text-text-primary">Sonuç Bulunamadı</p>
                <p className="text-xs text-text-secondary">
                  "{query}" ile eşleşen bir ürün veya koleksiyon bulunamadı.
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-editorial font-semibold text-text-secondary">
                  {results.length} Sonuç Bulundu
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-2.5 bg-surface-secondary hover:bg-surface-tertiary border border-border-subtle transition-colors group"
                    >
                      <div className="w-14 h-16 bg-surface-muted overflow-hidden shrink-0">
                        {product.images[0] && (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-sm text-text-primary truncate">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-text-secondary">{product.material}</p>
                        <p className="text-xs font-semibold text-text-primary pt-0.5">
                          {formatCurrency(product.retailPrice)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              /* Popular suggestions when input is empty */
              <div className="space-y-4 py-2">
                <p className="text-xs uppercase tracking-editorial font-semibold text-text-secondary">
                  Popüler Aramalar
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Amforik Taş Vazo', 'Zemin Vazoları', 'Ham Terakota', 'Stoneware', 'Nordik Sessizlik'].map(
                    (term) => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-subtle transition-colors"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
                  <span>Tüm ürünleri görüntülemek için:</span>
                  <Link
                    to="/products"
                    onClick={onClose}
                    className="font-medium text-text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Kataloğa Git</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
