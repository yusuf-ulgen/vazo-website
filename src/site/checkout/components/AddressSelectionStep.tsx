import { useState } from 'react';
import { Plus, MapPin, CheckCircle2 } from 'lucide-react';
import { CustomerAddress, CreateAddressInput, UpdateAddressInput } from '@/entities/customer/types';
import { AddressFormModal } from '@/site/components/AddressFormModal';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import { cn } from '@/shared/lib/cn';

interface AddressSelectionStepProps {
  title: string;
  description: string;
  addresses: CustomerAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (address: CustomerAddress) => void;
}

export function AddressSelectionStep({
  title,
  description,
  addresses,
  selectedAddressId,
  onSelectAddress,
}: AddressSelectionStepProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveNewAddress = async (input: CreateAddressInput | UpdateAddressInput) => {
    const created = await customerAuthStore.createAddress(input as CreateAddressInput);
    onSelectAddress(created);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h2 className="font-display text-2xl text-text-primary">{title}</h2>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border-default p-6 bg-surface-secondary">
          <MapPin className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">Kayıtlı Adresiniz Bulunmuyor</p>
          <p className="text-xs text-text-secondary mb-5">
            Siparişinizi teslim alabilmeniz için lütfen bir teslimat adresi tanımlayın.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Yeni Adres Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const isSelected = address.id === selectedAddressId;

            return (
              <div
                key={address.id}
                onClick={() => onSelectAddress(address)}
                className={cn(
                  'relative p-4 border rounded-sm cursor-pointer transition-all duration-200 text-left flex flex-col justify-between',
                  isSelected
                    ? 'border-text-primary bg-surface-primary shadow-sm ring-1 ring-text-primary'
                    : 'border-border-default bg-surface-primary hover:border-border-subtle'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-surface-muted text-text-primary rounded-xs uppercase tracking-wider">
                      {address.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-feedback-success shrink-0" />
                    )}
                  </div>

                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {address.recipient_name}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {address.address_line1} {address.address_line2}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {address.district ? `${address.district} / ` : ''}
                    {address.city}, {address.country_name}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                  <span>{address.phone}</span>
                  {address.is_default_shipping && (
                    <span className="text-feedback-info font-medium">Varsayılan</span>
                  )}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="p-6 border border-dashed border-border-default rounded-sm flex flex-col items-center justify-center gap-2 text-text-secondary hover:text-text-primary hover:border-text-primary bg-surface-secondary/40 transition-colors min-h-[140px]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">+ Yeni Adres Ekle</span>
          </button>
        </div>
      )}

      {isModalOpen && (
        <AddressFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewAddress}
        />
      )}
    </div>
  );
}
