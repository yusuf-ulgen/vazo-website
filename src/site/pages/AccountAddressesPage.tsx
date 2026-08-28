import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  LoaderCircle,
  Phone,
  User,
} from 'lucide-react';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Badge } from '@/shared/ui/Badge';
import { AddressFormModal } from '@/site/components/AddressFormModal';
import { CustomerAuthGuard } from '@/site/auth/CustomerAuthGuard';
import type {
  CustomerAddress,
  CreateAddressInput,
  UpdateAddressInput,
} from '@/entities/customer/types';

function AccountAddressesContent() {
  const {
    addresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultShipping,
    setDefaultBilling,
  } = useCustomerAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<CustomerAddress | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleOpenEdit = (addr: CustomerAddress) => {
    setAddressToEdit(addr);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleSave = async (
    input: CreateAddressInput | UpdateAddressInput,
    addressId?: string
  ) => {
    if (addressId) {
      await updateAddress(addressId, input as UpdateAddressInput);
    } else {
      await createAddress(input as CreateAddressInput);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    setDeletingId(addressId);
    setActionError(null);
    try {
      await deleteAddress(addressId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Adres silinemedi.';
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Section className="py-12 md:py-16">
      <Container size="lg">
        {/* Page Header */}
        <div className="border-b border-border-default pb-6 mb-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Hesabıma Dön</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                Teslimat ve Fatura
              </span>
              <h1 className="font-display text-3xl md:text-4xl text-text-primary mt-1">
                Kayıtlı Adreslerim
              </h1>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Adres Ekle</span>
            </button>
          </div>
        </div>

        {actionError && (
          <div className="p-4 mb-6 bg-feedback-danger-surface text-feedback-danger text-xs border border-feedback-danger/20">
            {actionError}
          </div>
        )}

        {/* Address Cards Grid */}
        {addresses.length === 0 ? (
          <div className="bg-surface-primary border border-border-default p-12 text-center max-w-md mx-auto space-y-4 shadow-card">
            <div className="w-12 h-12 rounded-full bg-surface-secondary text-text-muted flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl text-text-primary">Kayıtlı Adresiniz Yok</h2>
              <p className="text-xs text-text-secondary">
                Siparişlerinizde hızlı teslimat için yeni bir adres ekleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Adresi Ekle</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-surface-primary border border-border-default p-6 shadow-xs flex flex-col justify-between space-y-4 relative"
              >
                {/* Header: Label & Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg text-text-primary font-medium">
                        {addr.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {addr.is_default_shipping && (
                        <Badge
                          variant="muted"
                          className="text-[9px] uppercase font-bold tracking-wider"
                        >
                          Varsayılan Teslimat
                        </Badge>
                      )}
                      {addr.is_default_billing && (
                        <Badge
                          variant="muted"
                          className="text-[9px] uppercase font-bold tracking-wider"
                        >
                          Varsayılan Fatura
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Recipient & Phone */}
                  <div className="space-y-1 text-xs text-text-primary">
                    <p className="font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-text-muted" />
                      <span>{addr.recipient_name}</span>
                    </p>
                    <p className="text-text-secondary flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-text-muted" />
                      <span>{addr.phone}</span>
                    </p>
                  </div>

                  {/* Address Text */}
                  <div className="text-xs text-text-secondary leading-relaxed pt-2 border-t border-border-subtle">
                    <p>
                      {addr.address_line1}
                      {addr.address_line2 ? ` ${addr.address_line2}` : ''}
                    </p>
                    <p>
                      {addr.district ? `${addr.district} / ` : ''}
                      {addr.city}, {addr.postal_code}
                    </p>
                    <p className="font-medium text-text-primary mt-1">
                      {addr.country_name} ({addr.country_code})
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Default Switching Shortcuts */}
                  <div className="flex items-center gap-2">
                    {!addr.is_default_shipping && (
                      <button
                        type="button"
                        onClick={() => setDefaultShipping(addr.id)}
                        className="text-[11px] text-text-secondary hover:text-text-primary underline cursor-pointer"
                      >
                        Teslimat Yap
                      </button>
                    )}
                    {!addr.is_default_shipping && !addr.is_default_billing && (
                      <span className="text-text-muted">•</span>
                    )}
                    {!addr.is_default_billing && (
                      <button
                        type="button"
                        onClick={() => setDefaultBilling(addr.id)}
                        className="text-[11px] text-text-secondary hover:text-text-primary underline cursor-pointer"
                      >
                        Fatura Yap
                      </button>
                    )}
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-border-subtle transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === addr.id}
                      onClick={() => handleDelete(addr.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-feedback-danger hover:bg-feedback-danger-surface border border-feedback-danger/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === addr.id ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Address Create / Edit Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={addressToEdit}
        onSave={handleSave}
      />
    </Section>
  );
}

export function AccountAddressesPage() {
  return (
    <CustomerAuthGuard>
      <AccountAddressesContent />
    </CustomerAuthGuard>
  );
}
