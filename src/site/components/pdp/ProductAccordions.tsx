import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export function ProductAccordions() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const sections = [
    {
      title: 'Teknik Detaylar & Bakım',
      content:
        'Yüksek derecede (1250°C) fırınlanmış stoneware seramik gövde. Dış yüzey doğal mineral mat sır ile kaplıdır. Su geçirimsiz iç sırlama sayesinde taze çiçeklerle ve su ile kullanıma uygundur. Temizlik için ılık su ve yumuşak bez kullanılması, aşındırıcı kimyasallardan kaçınılması önerilir.',
    },
    {
      title: 'Kargo, Paketleme & Sevkiyat',
      content:
        'Siparişleriniz, seramik objelerin taşınması için özel tasarlanmış koruyucu ambalajlarla paketlenir. Sevkiyatlar anlaşmalı kargo firmaları aracılığıyla sigortalı olarak gönderilir. Kargo takip bilgileri sipariş sonrası iletilmektedir.',
    },
    {
      title: 'İade & Değişim Koşulları',
      content:
        'Teslimat tarihinden itibaren 14 gün içinde, orijinal ambalajında ve hasarsız olması koşuluyla iade ve değişim hakkınız bulunmaktadır. Teslimat anında hasar tespit edilmesi halinde stüdyomuzla iletişime geçilmesi yeterlidir.',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-12 md:py-16 border-b border-border-subtle">
      <Container size="md">
        <div className="divide-y divide-border-default border-y border-border-default">
          {sections.map((sec, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={sec.title} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-display text-lg sm:text-xl text-text-primary py-2 hover:opacity-75 transition-opacity"
                  aria-expanded={isOpen}
                >
                  <span>{sec.title}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pt-2 pb-4 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans font-normal transition-opacity duration-200">
                    <p>{sec.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
