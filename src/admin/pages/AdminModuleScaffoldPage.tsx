import { LucideIcon, ShieldCheck } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';

export interface AdminModuleScaffoldPageProps {
  moduleName: string;
  moduleCode: string;
  description: string;
  icon: LucideIcon;
  plannedFeatures: string[];
}

export function AdminModuleScaffoldPage({
  moduleName,
  moduleCode,
  description,
  icon: Icon,
  plannedFeatures,
}: AdminModuleScaffoldPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-primary border border-border-default p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-900 text-neutral-100 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-text-primary">{moduleName}</h2>
              <Badge variant="muted">{moduleCode}</Badge>
            </div>
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          </div>
        </div>

        <div>
          {/* Explicitly Disabled Action Button Example adhering to Section 19 Rule */}
          <button
            disabled
            title="Bu işlem backend CRUD entegrasyonu tamamlandığında aktifleşecektir."
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-neutral-200 text-neutral-500 border border-neutral-300 cursor-not-allowed select-none"
          >
            <span>Yeni Kayıt Oluştur</span>
            <span className="text-[10px] bg-neutral-300 px-1.5 py-0.5 rounded text-neutral-600">
              Devre Dışı
            </span>
          </button>
        </div>
      </div>

      {/* Planned Feature Blueprint Grid */}
      <div className="bg-surface-primary border border-border-default p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 text-text-primary">
          <ShieldCheck className="w-4 h-4 text-feedback-success" />
          <h3 className="text-xs uppercase font-semibold tracking-editorial">
            Planlanan Modül Sözleşmesi & Yetenekleri
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {plannedFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-3 bg-surface-secondary border border-border-subtle flex items-start gap-2.5 text-xs"
            >
              <span className="w-5 h-5 rounded-full bg-surface-muted text-text-secondary flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-text-secondary leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
