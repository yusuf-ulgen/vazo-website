import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  ShippingZone,
  ShippingRate,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  CreateShippingCountryInput,
  CreateShippingRateInput,
  UpdateShippingRateInput,
} from '@/entities/shipping/types';
import { adminShippingRepository } from '../api/admin-shipping-repository';
import { ZoneFormModal } from '../components/ZoneFormModal';
import { CountryFormModal } from '../components/CountryFormModal';
import { RateFormModal } from '../components/RateFormModal';
import { ConfirmDialog } from '@/admin/ui/ConfirmDialog';
import { formatMinorMoney } from '@/shared/lib/money';

export const AdminShippingPage: React.FC = () => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<ShippingZone | null>(null);

  const [countryModalZone, setCountryModalZone] = useState<ShippingZone | null>(null);

  const [rateModalZone, setRateModalZone] = useState<ShippingZone | null>(null);
  const [rateToEdit, setRateToEdit] = useState<ShippingRate | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminShippingRepository.getZones();
      setZones(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kargo verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Zone Handlers
  const handleSaveZone = async (
    input: CreateShippingZoneInput | UpdateShippingZoneInput,
    id?: string
  ) => {
    if (id) {
      await adminShippingRepository.updateZone(id, input);
    } else {
      await adminShippingRepository.createZone(input as CreateShippingZoneInput);
    }
    await loadData();
  };

  const handleDeleteZone = (zone: ShippingZone) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kargo Bölgesini Sil',
      message: `"${zone.name}" bölgesini ve bu bölgeye bağlı tüm ülke ve tarifeleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      onConfirm: async () => {
        await adminShippingRepository.deleteZone(zone.id);
        await loadData();
      },
    });
  };

  // Country Handlers
  const handleAddCountry = async (input: CreateShippingCountryInput) => {
    if (!countryModalZone) return;
    await adminShippingRepository.addCountryToZone(countryModalZone.id, input);
    await loadData();
  };

  const handleDeleteCountry = (zoneName: string, countryId: string, countryName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ülkeyi Bölgeden Çıkar',
      message: `"${countryName}" ülkesini "${zoneName}" bölgesinden çıkarmak istediğinize emin misiniz?`,
      onConfirm: async () => {
        await adminShippingRepository.removeCountryFromZone(countryId);
        await loadData();
      },
    });
  };

  // Rate Handlers
  const handleSaveRate = async (
    input: CreateShippingRateInput | UpdateShippingRateInput,
    rateId?: string
  ) => {
    if (rateId) {
      await adminShippingRepository.updateRate(rateId, input);
    } else if (rateModalZone) {
      await adminShippingRepository.createRate(rateModalZone.id, input as CreateShippingRateInput);
    }
    await loadData();
  };

  const handleDeleteRate = (zoneName: string, rate: ShippingRate) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kargo Tarifesini Sil',
      message: `"${rate.name}" tarifesini "${zoneName}" bölgesinden silmek istediğinizden emin misiniz?`,
      onConfirm: async () => {
        await adminShippingRepository.deleteRate(rate.id);
        await loadData();
      },
    });
  };

  const totalCountries = zones.reduce((acc, z) => acc + (z.countries?.length || 0), 0);
  const totalRates = zones.reduce((acc, z) => acc + (z.rates?.length || 0), 0);

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="font-display text-2xl text-text-primary tracking-tight font-medium">
            Kargo ve Lojistik Yönetimi
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Global ve yerel kargo bölgelerini, hedef ülkeleri ve gönderim tarifelerini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="p-2 text-text-secondary hover:text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoneToEdit(null);
              setIsZoneModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            Yeni Bölge Ekle
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface-primary border border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-secondary flex items-center justify-center text-text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Bölge Sayısı</p>
              <p className="font-display text-xl text-text-primary font-medium">{zones.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-primary border border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-secondary flex items-center justify-center text-text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Aktif Ülke Sayısı</p>
              <p className="font-display text-xl text-text-primary font-medium">{totalCountries}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-primary border border-border-default">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-secondary flex items-center justify-center text-text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-mono">Tarife Sayısı</p>
              <p className="font-display text-xl text-text-primary font-medium">{totalRates}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-feedback-danger-surface text-feedback-danger border border-feedback-danger/20 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-surface-secondary/50 animate-pulse border border-border-subtle" />
          ))}
        </div>
      )}

      {/* Zones List */}
      {!isLoading && zones.length === 0 && (
        <div className="py-12 bg-surface-primary border border-dashed border-border-default text-center space-y-3">
          <Globe className="w-10 h-10 text-text-muted mx-auto" />
          <p className="text-sm font-medium text-text-primary">Henüz kargo bölgesi tanımlanmamış</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Müşterilerinizin teslimat adresi seçebilmesi için en az bir aktif kargo bölgesi ve tarifesi oluşturun.
          </p>
          <button
            type="button"
            onClick={() => {
              setZoneToEdit(null);
              setIsZoneModalOpen(true);
            }}
            className="px-4 py-2 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
          >
            İlk Bölgeyi Oluştur
          </button>
        </div>
      )}

      {!isLoading &&
        zones.map((zone) => (
          <div
            key={zone.id}
            className="bg-surface-primary border border-border-default shadow-xs overflow-hidden"
          >
            {/* Zone Header */}
            <div className="p-4 sm:p-5 bg-surface-secondary/40 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base text-text-primary font-medium">{zone.name}</h2>
                  {zone.active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-neutral-500/10 text-neutral-600 border border-neutral-500/20 px-2 py-0.5 rounded">
                      <XCircle className="w-3 h-3" /> Pasif
                    </span>
                  )}
                  {zone.retail_enabled && (
                    <span className="text-[10px] bg-action-primary/10 text-action-primary px-2 py-0.5 rounded font-mono">
                      B2C Perakende
                    </span>
                  )}
                  {zone.wholesale_enabled && (
                    <span className="text-[10px] bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-mono">
                      B2B Toptan
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted font-mono">Öncelik: {zone.priority}</span>
                </div>
                {zone.description && <p className="text-xs text-text-secondary">{zone.description}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setZoneToEdit(zone);
                    setIsZoneModalOpen(true);
                  }}
                  className="p-1.5 text-text-secondary hover:text-text-primary border border-border-default hover:bg-surface-secondary rounded transition-colors"
                  title="Bölgeyi Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteZone(zone)}
                  className="p-1.5 text-feedback-danger hover:bg-feedback-danger-surface border border-border-default rounded transition-colors"
                  title="Bölgeyi Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zone Content: Countries & Rates */}
            <div className="p-4 sm:p-5 space-y-6">
              {/* Countries Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Kapsanan Ülkeler ({zone.countries?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCountryModalZone(zone)}
                    className="inline-flex items-center gap-1 text-xs text-action-primary hover:underline font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ülke Ekle
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(!zone.countries || zone.countries.length === 0) && (
                    <p className="text-xs text-text-muted italic py-1">
                      Bu bölgeye henüz ülke eklenmedi.
                    </p>
                  )}
                  {zone.countries?.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 bg-surface-secondary border border-border-default px-2.5 py-1 text-xs text-text-primary rounded shadow-2xs"
                    >
                      <span className="font-mono font-semibold text-[11px] text-action-primary">
                        {c.country_code}
                      </span>
                      <span>{c.country_name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCountry(zone.name, c.id, c.country_name)}
                        className="text-text-muted hover:text-feedback-danger transition-colors ml-0.5"
                        title="Ülkeyi Çıkar"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Rates Section */}
              <div className="space-y-3 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Gönderim Tarifeleri ({zone.rates?.length || 0})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRateModalZone(zone);
                      setRateToEdit(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-action-primary hover:underline font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tarife Ekle
                  </button>
                </div>

                {(!zone.rates || zone.rates.length === 0) ? (
                  <p className="text-xs text-text-muted italic py-1">
                    Bu bölgeye henüz kargo tarifesi tanımlanmadı.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-border-default">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-secondary/70 border-b border-border-default text-text-secondary font-medium font-mono">
                        <tr>
                          <th className="py-2.5 px-3">Tarife Adı</th>
                          <th className="py-2.5 px-3">Para Birimi</th>
                          <th className="py-2.5 px-3">Sabit Ücret</th>
                          <th className="py-2.5 px-3">Ücretsiz Kargo Limiti</th>
                          <th className="py-2.5 px-3">Teslimat Süresi</th>
                          <th className="py-2.5 px-3">Durum</th>
                          <th className="py-2.5 px-3 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle bg-surface-primary">
                        {zone.rates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-surface-secondary/30 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-text-primary">{rate.name}</td>
                            <td className="py-2.5 px-3 font-mono text-text-secondary">{rate.currency}</td>
                            <td className="py-2.5 px-3 font-semibold text-text-primary">
                              {formatMinorMoney(rate.flat_amount_minor, rate.currency)}
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {rate.free_shipping_threshold_minor != null
                                ? `${formatMinorMoney(rate.free_shipping_threshold_minor, rate.currency)} ve üzeri`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {rate.estimated_delivery_text || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {rate.active ? (
                                <span className="text-emerald-600 font-medium">Aktif</span>
                              ) : (
                                <span className="text-text-muted">Pasif</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRateModalZone(zone);
                                    setRateToEdit(rate);
                                  }}
                                  className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                                  title="Tarifeyi Düzenle"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRate(zone.name, rate)}
                                  className="p-1 text-feedback-danger hover:opacity-80 transition-colors"
                                  title="Tarifeyi Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

      {/* Modals */}
      <ZoneFormModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setZoneToEdit(null);
        }}
        zoneToEdit={zoneToEdit}
        onSave={handleSaveZone}
      />

      {countryModalZone && (
        <CountryFormModal
          isOpen={Boolean(countryModalZone)}
          onClose={() => setCountryModalZone(null)}
          zoneName={countryModalZone.name}
          onSave={handleAddCountry}
        />
      )}

      {rateModalZone && (
        <RateFormModal
          isOpen={Boolean(rateModalZone)}
          onClose={() => {
            setRateModalZone(null);
            setRateToEdit(null);
          }}
          zoneName={rateModalZone.name}
          rateToEdit={rateToEdit}
          onSave={handleSaveRate}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
