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
      icon: Sparkles,
      title: 'Ürün Hikayesi',
      description:
        storyText ||
        'Heykelsi hatları ve organik kıvrımlarıyla mekanlara sakin, dingin bir denge ve sanatsal bir odak noktası getirir.',
    },
    {
      icon: Hammer,
      title: 'El Yapımı & Zanaat',
      description:
        materialText ||
        'Her bir vazo, atölyemizde seramik ustaları tarafından el tornasında tek tek şekillendirilir ve 1250°C fırınlanır.',
    },
    {
      icon: Clock,
      title: 'Zamansız Tasarım',
      description:
        'Trendlerin ötesinde, hem modern hem de klasik mimari alanlara kusursuz uyum sağlayan minimal estetik.',
    },
  ];

  return (
    <section className="w-full bg-canvas-warm py-12 md:py-16 border-y border-border-subtle">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 p-6 bg-surface-primary/70 border border-border-subtle"
            >
              <div className="w-10 h-10 bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary mb-1">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg text-text-primary font-medium">
                {item.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed font-sans font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
