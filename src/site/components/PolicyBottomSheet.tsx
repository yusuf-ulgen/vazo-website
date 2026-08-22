import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShieldCheck, FileText, Truck, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import { usePolicyDrawer, PolicyTab } from '@/shared/stores/policy-drawer-store';

export function PolicyBottomSheet() {
  const { isOpen, activeTab, close, setTab } = usePolicyDrawer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const tabs: { id: PolicyTab; label: string; icon: typeof ShieldCheck }[] = [
    { id: 'privacy', label: 'Gizlilik & KVKK', icon: ShieldCheck },
    { id: 'terms', label: 'Kullanım Koşulları', icon: FileText },
    { id: 'shipping', label: 'Teslimat & İade', icon: Truck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300">
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Bottom Sheet Container (Expansive Standard Size) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Yasal Bilgilendirme ve Politikalar"
        className="relative w-full max-w-6xl h-[85vh] bg-surface-primary rounded-t-2xl shadow-elevated z-10 flex flex-col overflow-hidden animate-slide-up border-t border-border-default text-left mx-auto"
      >
        {/* Drag Handle Bar Indicator */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-14 h-1.5 bg-neutral-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 sm:px-10 py-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-primary">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-action-primary text-action-primary-text shadow-xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={close}
            aria-label="Kapat"
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-muted shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body (Full Expansive Height) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 text-xs sm:text-sm font-sans text-text-secondary leading-relaxed animate-fade-scale">
          {activeTab === 'privacy' && (
            <div className="space-y-6 max-w-5xl">
              <div className="space-y-2 border-b border-border-subtle pb-4">
                <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                  Aydınlatma Bildirimi & Bilgilendirme
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
                  Gizlilik Politikası & KVKK Aydınlatma Metni
                </h3>
                <p className="text-xs text-text-muted">
                  Son Güncelleme: 2026 • 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") Uyarınca Hazırlanmıştır.
                </p>
              </div>

              <div className="p-4 bg-surface-secondary border border-border-default flex items-start gap-3 text-xs text-text-secondary">
                <AlertCircle className="w-4 h-4 text-feedback-info shrink-0 mt-0.5" />
                <p>
                  <strong>Hukuki Güvence:</strong> Vazo Studio Tasarım ve Sanat Ürünleri San. Tic. A.Ş. olarak, ziyaretçilerimizin ve müşterilerimizin mahremiyetine saygı duyuyor; kişisel verilerinizin güvenliğini en üst düzey teknik ve idari tedbirlerle koruyoruz.
                </p>
              </div>

              <section className="space-y-2.5">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">1. Veri Sorumlusu Kimliği</h4>
                <p>
                  6698 sayılı KVKK kapsamında Veri Sorumlusu: <strong>Vazo Studio Tasarım ve Seramik Ürünleri A.Ş.</strong> (Karaköy Tasarım Bölgesi, Kemankeş Karamustafa Paşa Mah. No:42, Beyoğlu / İstanbul — MERSİS: 012345678900001, Vergi Dairesi: Beyoğlu VD 9876543210).
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">2. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</h4>
                <p>
                  Kişisel verileriniz; KVKK’nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları çerçevesinde aşağıdaki amaçlarla işlenmektedir:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Siparişlerinizin alınması, atölye üretim süreçlerinin planlanması ve teslimatın gerçekleştirilmesi (Sözleşmenin ifası),</li>
                  <li>Mevzuattan kaynaklanan e-fatura, e-arşiv ve mali yükümlülüklerin yerine getirilmesi (Hukuki yükümlülük),</li>
                  <li>Toptan ve mimari proje teklif taleplerinin değerlendirilmesi ve müşteri ilişkileri yönetimi (Meşru menfaat),</li>
                  <li>Açık rızanız doğrultusunda yeni koleksiyon, katalog ve sergi duyurularının iletilmesi.</li>
                </ul>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">3. İşlenen Kişisel Veri Kategorileri & Finansal Güvenlik</h4>
                <p>
                  İşlenen veriler: <strong>Kimlik Verileri</strong> (Ad-soyad), <strong>İletişim Verileri</strong> (E-posta, telefon, teslimat/fatura adresi), <strong>Müşteri İşlem Verileri</strong> (Sipariş geçmişi, talep metinleri), <strong>İşlem Güvenliği</strong> (IP adresi, log kayıtları).
                </p>
                <div className="p-3.5 bg-surface-secondary border border-border-subtle flex items-center gap-3 text-xs">
                  <Lock className="w-4 h-4 text-feedback-success shrink-0" />
                  <span>
                    <strong>Ödeme Güvenliği:</strong> Kredi kartı ve finansal bilgileriniz doğrudan PCI-DSS uyumlu lisanslı sanal POS altyapısına 256-bit SSL şifrelemeyle iletilir. Sunucularımızda hiçbir kart numarası veya güvenlik kodu saklanmaz.
                  </span>
                </div>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">4. Kişisel Verilerin Aktarımı</h4>
                <p>
                  Kişisel verileriniz yalnızca siparişin ifası için zorunlu olan anlaşmalı kargo/lojistik firmalarına, e-fatura entegratörlerine ve kanunen yetkili kamu kurum ve kuruluşlarına mevzuata uygun olarak aktarılmaktadır. Verileriniz hiçbir ticari üçüncü tarafa satılmaz.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">5. Çerez (Cookie) Politikası</h4>
                <p>
                  Platformumuzda sepetinizin korunması ve güvenli oturum sağlanması için zorunlu teknik çerezler kullanılmaktadır. Tarayıcı ayarlarınızdan dilediğiniz an çerez tercihlerinizi değiştirebilir veya mevcut çerezleri silebilirsiniz.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">6. KVKK 11. Madde Kapsamında Haklarınız</h4>
                <p>
                  KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme, işlemeye itiraz etme haklarına sahipsiniz. Başvurularınızı <strong>kvkk@vazostudio.com</strong> e-posta adresimize güvenli elektronik imzalı veya atölyemize yazılı olarak iletebilirsiniz.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 max-w-5xl">
              <div className="space-y-2 border-b border-border-subtle pb-4">
                <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                  Yasal Şartlar & Sözleşme İlkeleri
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
                  Kullanım Koşulları & Sözleşme İlkeleri
                </h3>
                <p className="text-xs text-text-muted">
                  Vazo Studio web sitesini ziyaret eden veya sipariş veren tüm kullanıcılar aşağıdaki hüküm ve koşulları kabul etmiş sayılır.
                </p>
              </div>

              <section className="space-y-2.5">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">1. Fikri ve Sınai Mülkiyet Hakları</h4>
                <p>
                  Bu web sitesinde sunulan tüm seramik heykelsi vazo tasarımları, 3D formlar, fotoğraflar, grafikler, metinler ve marka kimliği <strong>Vazo Studio</strong>'ya aittir. 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında korunmaktadır. İzinsiz kopyalanması, çoğaltılması veya ticari amaçla taklit edilmesi hukuki ve cezai yaptırıma tabidir.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">2. El Yapımı Zanaat ve Ürün Nitelikleri</h4>
                <p>
                  Koleksiyonlarımızdaki tüm vazolar, usta seramik sanatçılarımızın ellerinde geleneksel tornada şekillendirilmekte ve yüksek dereceli fırınlarda pişirilmektedir. Doğal mineral sır tepkimeleri ve fırın atmosferine bağlı olarak oluşabilecek mikron seviyesindeki doku nüansları ve ton geçişleri, her eserin kendine has ve biricik olduğunu simgeler; ayıplı ürün kapsamında değerlendirilmez.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">3. Sipariş, Fiyatlandırma ve Ödeme Hükümleri</h4>
                <p>
                  Web sitemizdeki perakende fiyatlar Türk Lirası cinsinden olup KDV dahildir. Toptan siparişlerde minimum sipariş adedi (MOQ) ve kademeli indirim oranları geçerlidir. Vazo Studio, kontrolü dışındaki hammadde veya döviz kur dalgalanmalarında fiyatları güncelleme hakkını saklı tutar.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">4. Kullanıcı Yükümlülükleri ve Güvenlik</h4>
                <p>
                  Kullanıcılar; sipariş oluştururken doğru, eksiksiz ve güncel teslimat bilgileri sunmakla yükümlüdür. Platform altyapısının güvenliğini tehdit edecek otomatik bot, kazıma (scraping) ve tersine mühendislik girişimleri kesinlikle yasaktır.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">5. Uyuşmazlıkların Çözümü ve Yetkili Mahkeme</h4>
                <p>
                  İşbu Kullanım Koşulları Türkiye Cumhuriyeti yasalarına tabidir. Doğabilecek her türlü uyuşmazlıkta Ticaret Bakanlığı tarafından belirlenen parasal sınırlar dahilinde İl/İlçe Tüketici Hakem Heyetleri ile <strong>İstanbul (Çağlayan) Tüketici Mahkemeleri ve İcra Daireleri</strong> münhasıran yetkilidir.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6 max-w-5xl">
              <div className="space-y-2 border-b border-border-subtle pb-4">
                <span className="text-[11px] uppercase font-semibold tracking-editorial text-text-secondary">
                  Güvenli Sevkiyat & İade Prosedürü
                </span>
                <h3 className="font-display text-2xl sm:text-3xl text-text-primary font-normal">
                  Teslimat & İade Koşulları
                </h3>
                <p className="text-xs text-text-muted">
                  Hassas seramik eserleriniz için özel darbe emici ambalajlama ve %100 sigortalı kargo güvencesi.
                </p>
              </div>

              <section className="space-y-2.5">
                <div className="flex items-center gap-2 text-text-primary font-display text-base sm:text-lg">
                  <Truck className="w-4 h-4 text-text-secondary" />
                  <h4>1. Özel Seramik Paketleme & Kargo Güvencesi</h4>
                </div>
                <p>
                  Her bir vazo, kırılma riskini tamamen ortadan kaldıran özel kesimli darbe emici köpük kalıplar ve çift kat oluklu mukavva kutularla ambalajlanır. Tüm gönderilerimiz anlaşmalı kargo şirketimiz aracılığıyla <strong>%100 Kırılma Sigortası</strong> kapsamında adresinize ulaştırılır.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">2. Teslimat Süreleri ve Takip</h4>
                <p>
                  Stoktaki perakende siparişleriniz <strong>1-3 iş günü</strong> içerisinde kargoya teslim edilir. Kargo takip kodunuz SMS ve e-posta ile tarafınıza iletilir. Toptan ve mimari özel üretim projelerde ise sipariş onayında belirtilen sözleşmeli takvim (ortalama 7-21 iş günü) uygulanır.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">3. Kargo Teslim Alma & Hasar Tespit Tutanağı</h4>
                <p>
                  Kargonuzu teslim alırken dış ambalajı kontrol ediniz. Eğer kolide ezilme, delinme veya hasar mevcutsa, kargo görevlisine derhal <strong>"Hasar Tespit Tutanağı"</strong> tutturunuz. Tutanağı bize iletmeniz halinde hiçbir ek ücret talep edilmeksizin derhal yeni ürün gönderimi sağlanır.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-2 text-text-primary font-display text-base sm:text-lg">
                  <RefreshCw className="w-4 h-4 text-text-secondary" />
                  <h4>4. 14 Günlük Koşulsuz İade Hakkı</h4>
                </div>
                <p>
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca, teslim aldığınız ürünü kullanılmamış, orijinal koruyucu ambalajı ve aksesuarları zarar görmemiş halde teslim tarihinden itibaren <strong>14 gün içerisinde</strong> iade edebilirsiniz.
                </p>
              </section>

              <section className="space-y-2.5 pt-4 border-t border-border-subtle">
                <h4 className="font-display text-base sm:text-lg text-text-primary font-medium">5. Ücretsiz İade Gönderimi ve Geri Ödeme</h4>
                <p>
                  İade talebinizi web sitemizden veya <strong>destek@vazostudio.com</strong> adresinden oluşturduktan sonra size verilecek ücretsiz kargo anlaşma koduyla paketinizi bize gönderebilirsiniz. Atölye teknik incelememizden geçen ürünün bedeli, onay takip eden <strong>3-5 iş günü</strong> içinde ödeme yaptığınız karta iade edilir.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer info in drawer */}
        <div className="px-6 sm:px-10 py-3.5 bg-surface-secondary border-t border-border-subtle flex items-center justify-between text-xs text-text-muted shrink-0">
          <span className="hidden sm:inline">Sorularınız ve kurumsal talepleriniz için müşteri destek ekibimizle görüşebilirsiniz.</span>
          <span className="sm:hidden">Sorularınız için bize ulaşın.</span>
          <Link
            to="/contact"
            onClick={close}
            className="text-text-primary font-semibold hover:underline flex items-center gap-1"
          >
            <span>İletişim & Destek</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
