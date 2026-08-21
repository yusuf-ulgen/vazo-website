import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categoryRepository } from '@/entities/category/api/category-repository';
import { Category } from '@/entities/category/types';
import { Container } from '@/shared/ui/Container';

export function CategoryTilesSection() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryRepository.getCategories().then((data) => setCategories(data));
  }, []);

  return (
    <section className="w-full bg-canvas-default py-16 md:py-24 border-b border-border-subtle">
      <Container size="lg">
        {/* Header (Reference 05) */}
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-12 border-b border-border-subtle pb-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-editorial text-text-secondary">
              Formlar & Kategoriler
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-text-primary mt-1">
              Kategorilere Göre Keşfedin
            </h2>
          </div>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wide text-text-primary hover:text-text-secondary transition-colors group"
          >
            <span>Tümünü Gör</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5-Column Grid (Reference 05) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug}`}
              className="group flex flex-col space-y-3"
            >
              <div className="aspect-square w-full overflow-hidden bg-surface-secondary">
                <img
                  src={
                    category.imageUrl ||
                    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="text-center pt-1">
                <h3 className="font-display text-sm md:text-base text-text-primary font-normal group-hover:underline">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
