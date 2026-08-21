import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { productRepository } from '@/entities/product/api/product-repository';
import { Product } from '@/entities/product/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSequenceRef = useRef<number>(0);

  const { containerRef } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const currentSeq = ++searchSequenceRef.current;

    const timeout = setTimeout(() => {
      productRepository
        .getProducts({ searchQuery: trimmed, retailOnly: true })
        .then((data) => {
          if (searchSequenceRef.current === currentSeq) {
            setResults(data);
          }
        })
        .catch((err) => {
          if (searchSequenceRef.current === currentSeq) {
            setSearchError(err.message || 'Arama yapılırken bir sorun oluştu.');
          }
        })
        .finally(() => {
          if (searchSequenceRef.current === currentSeq) {
            setIsSearching(false);
          }
        });
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Ürün Arama Modalı"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-24">
        <div className="relative w-full max-w-2xl bg-surface-primary shadow-elevated border border-border-default overflow-hidden">
          {/* Search Input Bar */}
          <div className="p-4 sm:p-6 border-b border-border-default flex items-center gap-3">
            <Search className="w-5 h-5 text-text-secondary shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Vazo modeli veya materyal ara..."
              aria-label="Ürün arama kutusu"
              className="w-full text-base sm:text-lg bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label="Aramayı Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase font-semibold tracking-wider text-text-secondary hover:text-text-primary px-2.5 py-1 border border-border-subtle"
            >
              Kapat
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 text-left">
            {isSearching ? (
              <div className="py-8 text-center text-xs text-text-secondary">
                <span>Aranıyor...</span>
              </div>
            ) : searchError ? (
              <div className="py-8 text-center text-xs text-feedback-danger">
                <span>{searchError}</span>
              </div>
            ) : query.trim() && results.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="font-display text-lg text-text-primary">Sonuç Bulunamadı</p>
                <p className="text-xs text-text-secondary">
                  "{query}" ile eşleşen bir model bulunamadı.
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
                        type="button"
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-subtle transition-colors"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
                  <span>Tüm modelleri keşfetmek için:</span>
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
