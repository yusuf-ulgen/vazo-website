import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Heart,
  ShoppingBag,
  Building2,
  Package,
  LogOut,
  Edit3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useCustomerAuth } from '@/shared/stores/customer-auth-store';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Badge } from '@/shared/ui/Badge';
import { ProfileEditModal } from '@/site/components/ProfileEditModal';
import { CustomerAuthGuard } from '@/site/auth/CustomerAuthGuard';

function AccountOverviewContent() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    addresses,
    displayName,
    email,
    isWholesaleApproved,
    signOut,
    updateProfile,
    claimTradeApplication,
  } = useCustomerAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ text: string; success: boolean } | null>(null);

  const defaultShippingAddress =
    addresses.find((a) => a.is_default_shipping) || addresses[0] || null;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      // Handled in store
    }
  };

  const handleClaimWholesale = async () => {
    try {
      setIsClaiming(true);
      setClaimMessage(null);
      const res = await claimTradeApplication();
      if (res.claimed) {
        setClaimMessage({
          text: res.message || `${res.company_name} başvurusu hesabınıza bağlandı. Toptan sipariş yetkiniz aktif!`,
          success: true,
        });
      } else {
        setClaimMessage({
          text: res.message || 'E-posta adresinizle eşleşen onaylı toptan başvuru bulunamadı.',
          success: false,
        });
      }
    } catch (err: unknown) {
      setClaimMessage({
        text: err instanceof Error ? err.message : 'Başvuru bağlanırken bir hata oluştu.',
        success: false,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Section className="py-12 md:py-16">
      <Container size="lg">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-default pb-6 mb-8">
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
              Müşteri Paneli
            </span>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary mt-1">
              Hesabım
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-feedback-danger border border-feedback-danger/30 hover:bg-feedback-danger-surface transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Oturumu Kapat</span>
            </button>
          </div>
        </div>

        {/* Claim Message Banner */}
        {claimMessage && (
          <div
            className={`p-4 mb-6 border text-xs flex items-center justify-between gap-3 animate-fade-in ${
              claimMessage.success
                ? 'bg-feedback-success-surface border-feedback-success/30 text-feedback-success'
                : 'bg-feedback-danger-surface border-feedback-danger/30 text-feedback-danger'
            }`}
          >
            <div className="flex items-center gap-2">
              {claimMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{claimMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setClaimMessage(null)}
              className="underline text-[11px] font-semibold hover:opacity-80"
            >
              Kapat
            </button>
          </div>
        )}

        {/* Overview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Profile Info & Addresses Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-surface-primary border border-border-default p-6 md:p-8 shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary shrink-0">
                    <User className="w-7 h-7 text-text-secondary" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-text-primary font-medium">
                      {displayName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={isWholesaleApproved ? 'default' : 'muted'}
                        className="text-[10px] tracking-wider uppercase"
                      >
                        {isWholesaleApproved ? 'Toptan Müşteri (B2B)' : 'Bireysel Müşteri'}
                      </Badge>
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-feedback-success" />
                        Google Doğrulanmış
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-default hover:bg-surface-secondary transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-subtle text-xs">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Mail className="w-4 h-4 text-text-muted shrink-0" />
                  <div className="truncate">
                    <span className="block text-[10px] uppercase text-text-muted">E-Posta</span>
                    <span className="text-text-primary font-medium truncate">{email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-text-secondary">
                  <Phone className="w-4 h-4 text-text-muted shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase text-text-muted">Telefon</span>
                    <span className="text-text-primary font-medium">
                      {profile?.phone || 'Telefon belirtilmemiş'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale B2B Status Card */}
            <div className="bg-surface-primary border border-border-default p-6 md:p-8 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isWholesaleApproved
                        ? 'bg-feedback-success/15 text-feedback-success'
                        : 'bg-surface-secondary text-text-muted'
                    }`}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-text-primary font-medium">
                      {isWholesaleApproved
                        ? 'Toptan / Kurumsal Hesap Aktif'
                        : 'Toptan & B2B Hesap Durumu'}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {isWholesaleApproved
                        ? 'Toptan katalog ve kademeli fiyat avantajları ile sipariş oluşturabilirsiniz.'
                        : 'Onaylı bir toptan başvurunuz varsa hesabınıza bağlayabilir veya yeni başvuru yapabilirsiniz.'}
                    </p>
                  </div>
                </div>

                {isWholesaleApproved ? (
                  <Link
                    to="/wholesale/products"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-text-primary text-canvas-default text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>Toptan Katalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={isClaiming}
                    onClick={handleClaimWholesale}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-secondary border border-border-default hover:bg-surface-muted text-text-primary text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {isClaiming ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-primary" />
                    )}
                    <span>{isClaiming ? 'Sorgulanıyor...' : 'Başvurumu Bağla'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Addresses Summary Card */}
            <div className="bg-surface-primary border border-border-default p-6 md:p-8 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display text-lg text-text-primary">Kayıtlı Adreslerim</h3>
                  <p className="text-xs text-text-secondary">
                    Toplam {addresses.length} adet kayıtlı adresiniz bulunuyor.
                  </p>
                </div>

                <Link
                  to="/account/addresses"
                  className="inline-flex items-center gap-1.5 text-xs text-text-primary font-medium hover:underline"
                >
                  <span>Tümünü Yönet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {defaultShippingAddress ? (
                <div className="p-4 bg-surface-secondary border border-border-subtle text-xs space-y-1.5 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-secondary" />
                      {defaultShippingAddress.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-surface-primary border border-border-subtle text-text-secondary">
                      Varsayılan Teslimat
                    </span>
                  </div>
                  <p className="text-text-primary font-medium">
                    {defaultShippingAddress.recipient_name} • {defaultShippingAddress.phone}
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    {defaultShippingAddress.address_line1}
                    {defaultShippingAddress.address_line2 ? ` ${defaultShippingAddress.address_line2}` : ''}
                    {defaultShippingAddress.district ? `, ${defaultShippingAddress.district}` : ''} /{' '}
                    {defaultShippingAddress.city}, {defaultShippingAddress.postal_code}
                  </p>
                  <p className="text-[11px] text-text-muted">{defaultShippingAddress.country_name}</p>
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border-subtle bg-surface-secondary/50 mt-4">
                  <p className="text-xs text-text-secondary mb-3">
                    Henüz kayıtlı bir teslimat adresi bulunmuyor.
                  </p>
                  <Link
                    to="/account/addresses"
                    className="inline-flex items-center justify-center px-4 py-2 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Yeni Adres Ekle
                  </Link>
                </div>
              )}
            </div>

            {/* Orders Section */}
            <div className="bg-surface-primary border border-border-default p-6 md:p-8 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-primary">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-text-primary">Sipariş Geçmişim</h3>
                    <p className="text-xs text-text-secondary">
                      Verdiğiniz siparişlerin kargo takibi, faturaları ve durum sorgusu.
                    </p>
                  </div>
                </div>
                <Link
                  to="/account/orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-secondary hover:bg-surface-muted text-text-primary text-xs font-semibold border border-border-default transition-colors"
                >
                  <span>Siparişleri Gör</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-4">
            <div className="bg-surface-primary border border-border-default p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Hızlı Erişim
              </h3>

              <Link
                to="/account/orders"
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-text-secondary" />
                  <span>Siparişlerim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/account/addresses"
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <span>Adreslerim ({addresses.length})</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/cart"
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-text-secondary" />
                  <span>Alışveriş Sepetim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/wishlist"
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-text-secondary" />
                  <span>Favorilerim</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>

              <Link
                to="/wholesale/apply"
                className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-muted text-text-primary border border-border-subtle transition-colors text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-text-secondary" />
                  <span>Toptan Ticari Başvuru</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary" />
              </Link>
            </div>
          </div>
        </div>
      </Container>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        email={user?.email || null}
        onSave={async (input) => {
          await updateProfile(input);
        }}
      />
    </Section>
  );
}

export function AccountOverviewPage() {
  return (
    <CustomerAuthGuard>
      <AccountOverviewContent />
    </CustomerAuthGuard>
  );
}
