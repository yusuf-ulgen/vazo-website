import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  PackagePlus,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Badge } from '@/shared/ui/Badge';

export function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Top Banner: Governance Notice */}
      <div className="bg-surface-primary border border-border-default p-5 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-feedback-success animate-pulse" />
            <h2 className="text-sm font-semibold text-text-primary">
              Admin Paneli — Faz 0 Temel İskelet
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Tüm modül rotaları ve tasarım tokenları yapılandırılmıştır. CRUD eylemleri backend entegrasyonu tamamlandıkça aktifleşecektir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 bg-action-primary text-action-primary-text text-xs font-medium px-4 py-2 hover:bg-neutral-800 transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Ürünleri Yönet</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Toplam Satış (Aylık)"
          value="₺148.650"
          change="+18.4%"
          changeType="positive"
          icon={DollarSign}
          subtext="Geçen aya göre"
        />
        <StatsCard
          title="Aktif Siparişler"
          value="34"
          change="8 Toptan"
          changeType="neutral"
          icon={ShoppingCart}
          subtext="26 Perakende"
        />
        <StatsCard
          title="Kritik Stok Uyarısı"
          value="3 Model"
          change="Dikkat"
          changeType="negative"
          icon={Boxes}
          subtext="MOQ altı seviye"
        />
        <StatsCard
          title="B2B Trade Başvuruları"
          value="5 Bekleyen"
          change="Yeni"
          changeType="positive"
          icon={Building2}
          subtext="İç mimar onayı"
        />
      </div>

      {/* Two Column Layout: Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Orders Overview (8 columns) */}
        <div className="lg:col-span-8 bg-surface-primary border border-border-default p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Son Siparişler (Perakende & Toptan)
              </h3>
              <p className="text-xs text-text-secondary">
                Son 24 saat içinde gelen sipariş akışı
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-secondary">
                  <th className="py-2.5 font-semibold">Sipariş No</th>
                  <th className="py-2.5 font-semibold">Kanal</th>
                  <th className="py-2.5 font-semibold">Müşteri</th>
                  <th className="py-2.5 font-semibold">Tutar</th>
                  <th className="py-2.5 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-primary">
                <tr>
                  <td className="py-3 font-mono font-medium">#ORD-2026-891</td>
                  <td className="py-3">
                    <Badge variant="wholesale">Toptan</Badge>
                  </td>
                  <td className="py-3">Studio Mono Mimarlık (12 Vazo)</td>
                  <td className="py-3 font-medium">₺16.800</td>
                  <td className="py-3">
                    <Badge variant="warning">Hazırlanıyor</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-medium">#ORD-2026-890</td>
                  <td className="py-3">
                    <Badge variant="default">Perakende</Badge>
                  </td>
                  <td className="py-3">Ayşe Yılmaz (1 Vazo)</td>
                  <td className="py-3 font-medium">₺2.450</td>
                  <td className="py-3">
                    <Badge variant="success">Kargoya Verildi</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-mono font-medium">#ORD-2026-889</td>
                  <td className="py-3">
                    <Badge variant="wholesale">Toptan</Badge>
                  </td>
                  <td className="py-3">Artisan Otel Bodrum (20 Vazo)</td>
                  <td className="py-3 font-medium">₺24.000</td>
                  <td className="py-3">
                    <Badge variant="muted">Ödeme Bekliyor</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Actions & Backend Pending Notice (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-surface-primary border border-border-default p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <Link
                to="/admin/products"
                className="w-full flex items-center justify-between p-3 text-xs bg-surface-secondary hover:bg-neutral-200 border border-border-subtle rounded transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-text-secondary" />
                  <span>Yeni Ürün Ekle</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <Link
                to="/admin/wholesale"
                className="w-full flex items-center justify-between p-3 text-xs bg-surface-secondary hover:bg-neutral-200 border border-border-subtle rounded transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-text-secondary" />
                  <span>Trade Başvurularını İncele</span>
                </span>
                <Badge variant="warning">5</Badge>
              </Link>

              {/* Explicitly Disabled Control Example */}
              <button
                disabled
                title="Bu özellik henüz backend entegrasyonu aşamasındadır"
                className="w-full flex items-center justify-between p-3 text-xs bg-surface-muted text-text-muted border border-dashed border-border-default cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel Envanter Dışa Aktar</span>
                </span>
                <span className="text-[10px] uppercase font-semibold">Devre Dışı</span>
              </button>
            </div>
          </div>

          {/* Architecture Status Card */}
          <div className="bg-surface-secondary border border-border-default p-5 space-y-3">
            <div className="flex items-center gap-2 text-text-primary text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-brand-terracotta" />
              <span>Mimari Sözleşme</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Admin panelindeki her etkileşimli kontrol ya işlevseldir ya da backend entegrasyonu bekleniyor olarak açıkça devre dışıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
