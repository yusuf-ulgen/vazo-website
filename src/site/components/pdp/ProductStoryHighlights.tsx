import { Sparkles, Hammer, Clock } from 'lucide-react';
import { Container } from '@/shared/ui/Container';

export interface ProductStoryHighlightsProps {
  storyText?: string;
  materialText?: string;
}

export function ProductStoryHighlights({
  storyText,
  materialText,
}: ProductStoryHighlightsProps) {
  const items = [
    {
      icon: Clock,
      title: 'Ürün Hikayesi',
      description:
        storyText ||
        'Ayın ışığından ilham alan organik formu ve zarif kıvrımlarıyla mekanlara sakin bir denge getirir.',
    },
    {
      icon: Hammer,
      title: 'El Yapımı & Zanaat',
      description:
        materialText ||
        'Her bir parça, usta ellerde el tornasında şekillendirilir ve 1250°C fırınlanır.',
    },
    {
      icon: Sparkles,
      title: 'Zamansız Tasarım',
      description:
        'Minimal, heykelsi ve zamansız formu ile modern ve klasik mekanlara uyum sağlar.',
    },
  ];

  return (
    <section className="w-full bg-canvas-default py-8 border-y border-border-subtle">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-subtle text-left">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 p-4 md:px-6 first:pl-0 last:pr-0"
            >
              <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-text-primary shrink-0">
                <item.icon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                  {item.title}
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed font-sans font-normal">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
