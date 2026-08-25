import { LucideIcon, CheckCircle2 } from 'lucide-react';
import { AdminPageHeader } from '../ui/AdminPageHeader';
import { AdminCard } from '../ui/AdminCard';
import { StatusBadge } from '../ui/StatusBadge';

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
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title={moduleName}
        description={description}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: moduleName },
        ]}
        badge={<StatusBadge status="draft" label={moduleCode} />}
      />

      {/* Module Overview Card */}
      <AdminCard
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-surface-secondary flex items-center justify-center text-text-primary">
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-text-primary">Modül Özellikleri & Planı</span>
          </div>
        }
        subtitle="Bu modül için planlanan özellikler ve CRUD veri yapıları aşağıda listelenmiştir."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plannedFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-surface-secondary border border-border-subtle flex items-start gap-3 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-surface-primary border border-border-default text-feedback-success flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-text-secondary leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
