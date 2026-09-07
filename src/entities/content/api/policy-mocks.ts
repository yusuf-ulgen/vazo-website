export interface PolicySection {
  id: string;
  pageId: string;
  sectionKey: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  content?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface PolicyPageMock {
  id: string;
  pageKey: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  published: boolean;
  sections: PolicySection[];
}

export const mockPolicyPages: Record<string, PolicyPageMock> = {
  terms: {
    id: 'cp-terms',
    pageKey: 'terms',
    title: 'Mesafeli Satış & Kullanım Koşulları',
    seoTitle: 'Kullanım Koşulları | Vazo Studio',
    seoDescription: 'Vazo Studio web sitesi kullanım şartları, fikri mülkiyet hakları, kullanıcı yükümlülükleri ve sipariş genel koşulları.',
    published: true,
    sections: [
      {
        id: 'cs-terms-1',
        pageId: 'cp-terms',
        sectionKey: 'intellectual_property',
        title: '1. Fikri Mülkiyet & Telif Hakları',
        content: `Vazo Studio markası altında sunulan tüm heykelsi seramik tasarımları, vazo formları, 3D modellemeler, ürün fotoğraf ve videoları, editoryal metinler, grafikler, logo ve web sitesi yazılım mimarisi Vazo Studio'nun münhasır mülkiyetindedir ve 5846 sayılı Fikir ve Sanat Eserleri Kanunu ile 6769 sayılı Sınai Mülkiyet Kanunu kapsamında korunmaktadır.

Yazılı ön izin alınmaksızın bu materyallerin kopyalanması, ticari amaçla çoğaltılması, benzerlerinin üretilerek haksız rekabet yaratılması veya herhangi bir dijital/fiziki mecrada izinsiz kullanımı kesinlikle yasaktır ve cezai/hukuki yaptırımlara tabidir.`,
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-terms-2',
        pageId: 'cp-terms',
        sectionKey: 'distance_sales',
        title: '2. Mesafeli Satış & Sipariş Koşulları',
        content: `Web sitemiz üzerinden verilen tüm siparişler 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tabidir.

Alıcı, sipariş formunu onayladığında ve ödemeyi gerçekleştirdiğinde işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Satıcı, haklı bir gerekçe olması halinde siparişi iptal ederek tahsil edilen tutarı yasal sürede iade etme hakkını saklı tutar.`,
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-terms-3',
        pageId: 'cp-terms',
        sectionKey: 'user_obligations',
        title: '3. Kullanıcı Yükümlülükleri ve Güvenlik',
        content: `Kullanıcı, siteyi kullanırken yürürlükteki mevzuata, genel ahlak ve dürüstlük kurallarına uymayı taahhüt eder. Sitenin güvenliğini tehdit edecek, altyapıyı aşırı yükleyecek veya diğer kullanıcıların deneyimini engelleyecek herhangi bir otomatik bot veya zararlı yazılım kullanılamaz.

Kullanıcı hesabı oluşturulurken verilen e-posta, teslimat adresi ve iletişim bilgilerinin doğruluğundan kullanıcı bizzat sorumludur.`,
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-terms-4',
        pageId: 'cp-terms',
        sectionKey: 'craft_characteristics',
        title: '4. El İşçiliği Seramik ve Zanaat Karakteristiği',
        content: `Koleksiyonlarımızda yer alan tüm vazo ve objeler, endüstriyel kalıp döküm yerine seramik ustaları tarafından el tornasında tek tek üretilmekte ve 1250°C sıcaklıkta fırınlanmaktadır.

Doğal mineral sırların fırın içindeki kimyasal reaksiyonları ve el işçiliği doğası gereği; ürünlerin ebatlarında (±%3 oranında), yüzey dokusunda ve renk tonu geçişlerinde küçük doğal varyasyonlar oluşabilir. Bu varyasyonlar bir kusur olmayıp, her bir esere özgün monolitik bir zanaat kimliği kazandırır.`,
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-terms-5',
        pageId: 'cp-terms',
        sectionKey: 'pricing_and_payment',
        title: '5. Fiyatlandırma ve Ödeme Koşulları',
        content: `Sitede belirtilen perakende ürün fiyatlarına yürürlükteki KDV dahildir. Toptan ve kurumsal siparişlerde aksi belirtilmedikçe teklif bazlı KDV hariç fiyatlar geçerlidir.

Ödemeler uluslararası PCI-DSS Level 1 uyumlu güvenli ödeme altyapısı üzerinden kredi kartı, banka kartı veya havale/EFT yöntemleriyle tahsil edilir.`,
        sortOrder: 5,
        active: true,
      },
      {
        id: 'cs-terms-6',
        pageId: 'cp-terms',
        sectionKey: 'force_majeure',
        title: '6. Mücbir Sebepler ve Sorumluluk Sınırı',
        content: `Doğal afetler, yangın, sel, deprem, salgın hastalıklar, siber saldırılar veya lojistik grevleri gibi tarafların kontrolü dışında gelişen mücbir sebep hallerinde; Vazo Studio teslimat sürelerini uzatma veya siparişi tazminatsız iptal ederek ücreti iade etme hakkına sahiptir.`,
        sortOrder: 6,
        active: true,
      },
      {
        id: 'cs-terms-7',
        pageId: 'cp-terms',
        sectionKey: 'disputes',
        title: '7. Uyuşmazlıkların Çözümü ve Yetkili Mahkeme',
        content: `İşbu Kullanım Koşullarından doğabilecek her türlü ihtilafta Türk Hukuku uygulanır. Tüketici işlemlerinde Ticaret Bakanlığınca belirlenen parasal sınırlar dahilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.`,
        sortOrder: 7,
        active: true,
      },
    ],
  },
  privacy_kvkk: {
    id: 'cp-privacy',
    pageKey: 'privacy_kvkk',
    title: 'Gizlilik Politikası & KVKK Aydınlatma Metni',
    seoTitle: 'Gizlilik Politikası & KVKK | Vazo Studio',
    seoDescription: '6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca aydınlatma ve veri gizliliği bildirimi.',
    published: true,
    sections: [
      {
        id: 'cs-priv-1',
        pageId: 'cp-privacy',
        sectionKey: 'data_controller',
        title: '1. Veri Sorumlusu',
        content: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, Vazo Studio ("Şirket / Monocactus") olarak veri sorumlusu sıfatıyla kişisel verilerinizi kanuna uygun şekilde işlemekte ve korumaktayız.

Şirketimiz, müşterilerimizin ve ziyaretçilerimizin mahremiyetine en üst seviyede saygı göstermekte ve uluslararası güvenlik standartlarında teknik ve idari tedbirleri uygulamaktadır.`,
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-priv-2',
        pageId: 'cp-privacy',
        sectionKey: 'processed_data',
        title: '2. İşlenen Kişisel Veriler & Güvenlik',
        content: `Web sitemizi ziyaretiniz ve sipariş süreçleriniz kapsamında; ad-soyad, teslimat ve fatura adresi, e-posta adresi, telefon numarası ve IP adresi verileriniz işlenir.

Kredi kartı ve ödeme bilgileri doğrudan lisanslı ödeme kuruluşunun PCI-DSS standartlarındaki güvenli altyapısında işlenir; stüdyomuz sunucularında kart bilgisi tutulmaz.`,
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-priv-3',
        pageId: 'cp-privacy',
        sectionKey: 'processing_purposes',
        title: '3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri',
        content: `Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen şartlar dahilinde;
1. Mesafeli Satış Sözleşmesi ve sipariş süreçlerinin ifası,
2. Sipariş edilen ürünlerin adresinize hasarsız kargo teslimatının sağlanması,
3. Yasal e-fatura ve muhasebe kayıtlarının tutulması,
4. Müşteri destek ve iade süreçlerinin yönetilmesi,
amaçlarıyla ve kanuni yükümlülüklerin yerine getirilmesi hukuki sebeplerine dayalı olarak işlenmektedir.`,
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-priv-4',
        pageId: 'cp-privacy',
        sectionKey: 'data_transfer',
        title: '4. Kişisel Verilerin Aktarılması',
        content: `Kişisel verileriniz, yalnızca sipariş paketlerinin sevkiyatı için anlaşmalı kargo firmalarına, yasal faturalandırma için e-fatura entegratörlerine ve kanunen yetkili kamu kurumlarına aktarılabilmektedir. Verileriniz hiçbir surette üçüncü şahıslara ticari amaçla satılmaz.`,
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-priv-5',
        pageId: 'cp-privacy',
        sectionKey: 'payment_security',
        title: '5. Ödeme Güvenliği ve Finansal Veriler (PCI-DSS)',
        content: `Sitemiz üzerinden gerçekleştirilen tüm kart işlemleri, uluslararası PCI-DSS Level 1 güvenlik sertifikasına sahip lisanslı ödeme kuruluşu altyapısı üzerinden 256-bit SSL şifreleme ve 3D Secure güvencesi ile doğrudan bankalar arasında gerçekleşir. Kart verileriniz sunucularımızda saklanmaz.`,
        sortOrder: 5,
        active: true,
      },
      {
        id: 'cs-priv-6',
        pageId: 'cp-privacy',
        sectionKey: 'cookie_policy',
        title: '6. Çerez (Cookie) Kullanımı',
        content: `Platformumuzda; oturumunuzu açık tutmak, sepetinizi hatırlamak ve kullanıcı deneyiminizi geliştirmek amacıyla zorunlu ve işlevsel çerezler kullanılmaktadır. Tarayıcı ayarlarınız üzerinden çerez tercihlerinizi dilediğiniz zaman yönetebilirsiniz.`,
        sortOrder: 6,
        active: true,
      },
      {
        id: 'cs-priv-7',
        pageId: 'cp-privacy',
        sectionKey: 'user_rights',
        title: '7. KVKK Kapsamındaki Haklarınız ve İletişim',
        content: `KVKK'nın 11. maddesi uyarınca veri sahipleri; verilerinin işlenip işlenmediğini öğrenme, işlenme amacını öğrenme, eksik veya yanlış verilerin düzeltilmesini ve silinmesini talep etme haklarına sahiptir. Taleplerinizi İletişim sayfamızdan bize yazılı olarak iletebilirsiniz.`,
        sortOrder: 7,
        active: true,
      },
    ],
  },
  shipping_returns: {
    id: 'cp-shipping',
    pageKey: 'shipping_returns',
    title: 'Teslimat & İade Koşulları',
    seoTitle: 'Teslimat & İade Koşulları | Vazo Studio',
    seoDescription: 'Vazo Studio sigortalı kargo teslimatı, darbe sönümleyici ambalaj ve 14 gün koşulsuz iade süreci.',
    published: true,
    sections: [
      {
        id: 'cs-ship-1',
        pageId: 'cp-shipping',
        sectionKey: 'delivery_guarantee',
        title: '1. Kırılmaya Karşı %100 Güvenli Sevkiyat',
        content: `Tüm siparişlerimiz, yüksek yoğunluklu özel kesim darbe sönümleyici süngerler ve çift oluklu kraft mukavva kutularda sevk edilir.

Kargo taşıma sürecinde oluşabilecek her türlü hasar stüdyomuzun tam güvencesi altındadır. Kargonuz hasarlı ulaştığında fotoğraf iletmeniz halinde derhal ücretsiz yeni ürün gönderilir.`,
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-ship-2',
        pageId: 'cp-shipping',
        sectionKey: 'return_policy',
        title: '2. 14 Gün Koşulsuz İade Hakkı',
        content: `Satın aldığınız ürünleri teslim aldığınız tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin orijinal ambalajında iade edebilirsiniz.

İade edilen ürünler incelendikten sonra 3 iş günü içerisinde ödeme tutarınız kartınıza kesintisiz iade edilir.`,
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-ship-3',
        pageId: 'cp-shipping',
        sectionKey: 'shipping_timeline',
        title: '3. Kargo Süreçleri ve Teslimat Süreleri',
        content: `Stoklu siparişleriniz 1-3 iş günü içerisinde kargoya teslim edilir ve kargo takip numarası e-posta ile iletilir. Belirlenen sepet tutarı üzerindeki perakende siparişlerde standart kargo ücretsizdir.`,
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-ship-4',
        pageId: 'cp-shipping',
        sectionKey: 'inspection_procedure',
        title: '4. Teslim Anında Kontrol ve Hasar Güvencesi',
        content: `Kargonuzu teslim alırken pakette ezilme veya delinme varsa kargo görevlisine tutanak tutturabilir veya hasarlı ürün fotoğraflarını aynı gün içinde müşteri destek ekibimize ileterek anında telafi talebinde bulunabilirsiniz.`,
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-ship-5',
        pageId: 'cp-shipping',
        sectionKey: 'refund_timeline',
        title: '5. İade Süreci ve Ücret İadesi',
        content: `Hesabınız üzerinden iade talebi oluşturarak anlaşmalı kargo iade kodu ile ürünü ücretsiz gönderebilirsiniz. İade tutarı kalite kontrol sonrasında 3 iş günü içinde kartınıza iade edilir.`,
        sortOrder: 5,
        active: true,
      },
      {
        id: 'cs-ship-6',
        pageId: 'cp-shipping',
        sectionKey: 'custom_order_exception',
        title: '6. Kişiye Özel Üretim ve Kurumsal Toptan İstisnaları',
        content: `Müşteri talebine özel sır veya renkle kişiselleştirilen ürünlerde ve toplu kurumsal üretimlerde mevzuat gereği cayma hakkı geçerli değildir.`,
        sortOrder: 6,
        active: true,
      },
    ],
  },
  preliminary_info: {
    id: 'cp-preliminary',
    pageKey: 'preliminary_info',
    title: 'Ön Bilgilendirme Koşulları',
    seoTitle: 'Ön Bilgilendirme Koşulları | Vazo Studio',
    seoDescription: '6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca sipariş öncesi tüketici ön bilgilendirme şartları.',
    published: true,
    sections: [
      {
        id: 'cs-pre-1',
        pageId: 'cp-preliminary',
        sectionKey: 'seller_info',
        title: '1. Satıcı ve Hizmet Sağlayıcı Bilgileri',
        content: `İşbu Ön Bilgilendirme Formu kapsamında satıcı bilgileri; ticaret unvanı, tescilli adresi, vergi kimlik numarası, müşteri hizmetleri telefon ve e-posta kanalları ile satıcı bilgilendirme sayfasında yer alan resmi sicil verileridir. Alıcı sipariş onayından önce tüm bu bilgileri teyit ettiğini kabul eder.`,
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-pre-2',
        pageId: 'cp-preliminary',
        sectionKey: 'product_scope',
        title: '2. Sözleşme Konusu Malın Temel Nitelikleri ve Toplam Fiyat',
        content: `Siparişe konu vazo ve heykelsi objelerin cinsi, türü, adedi, rengi, boyutu, tüm vergiler dahil toplam satış bedeli, kargo ücreti ve ödeme planı ödeme adımındaki sipariş özetinde gösterilmektedir. Alıcı, siparişi onaylamadan önce nihai bedeli inceleyip onayladığını beyan eder.`,
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-pre-3',
        pageId: 'cp-preliminary',
        sectionKey: 'delivery_terms',
        title: '3. Teslimat ve İfa Şartları',
        content: `Sipariş konusu ürün, yasal 30 günlük süreyi aşmamak koşuluyla Alıcının sipariş formunda belirttiği teslimat adresine anlaşmalı kargo şirketi aracılığıyla güvenli ambalajında teslim edilir.`,
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-pre-4',
        pageId: 'cp-preliminary',
        sectionKey: 'withdrawal_rules',
        title: '4. Cayma Hakkı Şartları ve Kullanım Şekli',
        content: `Alıcı, malı teslim aldığı tarihten itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.`,
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-pre-5',
        pageId: 'cp-preliminary',
        sectionKey: 'legal_complaints',
        title: '5. Şikayet ve İtiraz Başvuruları',
        content: `Alıcı, sipariş ve ürünlere ilişkin her türlü şikayet ve itirazlarını Satıcının müşteri destek birimine iletebilir. Uyuşmazlık halinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.`,
        sortOrder: 5,
        active: true,
      },
    ],
  },
  distance_sales: {
    id: 'cp-distance',
    pageKey: 'distance_sales',
    title: 'Mesafeli Satış Sözleşmesi',
    seoTitle: 'Mesafeli Satış Sözleşmesi | Vazo Studio',
    seoDescription: 'Vazo Studio e-ticaret platformu üzerinden akdedilen resmi mesafeli satış sözleşmesi hüküm ve şartları.',
    published: true,
    sections: [
      {
        id: 'cs-dist-1',
        pageId: 'cp-distance',
        sectionKey: 'parties',
        title: 'Madde 1 — Taraflar ve Tanımlar',
        content: `İşbu Mesafeli Satış Sözleşmesi ("Sözleşme"), Satıcı (Vazo Studio / Monocactus) ile internet sitesi üzerinden elektronik ortamda sipariş veren tüketici ("Alıcı") arasında sipariş onayı anında yürürlüğe girmiştir.`,
        sortOrder: 1,
        active: true,
      },
      {
        id: 'cs-dist-2',
        pageId: 'cp-distance',
        sectionKey: 'subject',
        title: 'Madde 2 — Sözleşmenin Konusu',
        content: `İşbu Sözleşmenin konusu; Alıcının elektronik ortamda siparişini yaptığı el yapımı seramik ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince hak ve yükümlülüklerin saptanmasıdır.`,
        sortOrder: 2,
        active: true,
      },
      {
        id: 'cs-dist-3',
        pageId: 'cp-distance',
        sectionKey: 'product_and_payment',
        title: 'Madde 3 — Ürün Bedeli ve Ödeme Esasları',
        content: `Seçilen ürünlerin cinsi, miktarı, KDV dahil toplam bedeli ve kargo masrafları sipariş özetinde belirtilmiştir. Alıcı, bedeli seçtiği ödeme yöntemi ile ödemeyi kabul eder.`,
        sortOrder: 3,
        active: true,
      },
      {
        id: 'cs-dist-4',
        pageId: 'cp-distance',
        sectionKey: 'delivery_execution',
        title: 'Madde 4 — Teslimat Şartları',
        content: `Ürünler, yasal 30 günlük azami süreyi aşmamak kaydıyla Alıcının belirttiği adrese anlaşmalı kargo firması ile hasarsız koruyucu ambalajında teslim edilir.`,
        sortOrder: 4,
        active: true,
      },
      {
        id: 'cs-dist-5',
        pageId: 'cp-distance',
        sectionKey: 'withdrawal_right',
        title: 'Madde 5 — Cayma Hakkı ve İade Koşulları',
        content: `Alıcı, malı teslim aldığı tarihten itibaren 14 gün içinde cayma hakkını kullanabilir. Ücret iadesi ürünün Satıcıya ulaşmasından itibaren en geç 14 gün içinde yapılır.`,
        sortOrder: 5,
        active: true,
      },
      {
        id: 'cs-dist-6',
        pageId: 'cp-distance',
        sectionKey: 'warranty_and_defects',
        title: 'Madde 6 — Ayıplı Mal ve Garanti',
        content: `El işçiliği seramik üretiminin doğasından kaynaklanan hafif doku ve fırın sır tonu varyasyonları ayıplı mal sayılmaz. Taşıma veya üretim kaynaklı kırık/çatlak durumunda ücretsiz değişim sağlanır.`,
        sortOrder: 6,
        active: true,
      },
      {
        id: 'cs-dist-7',
        pageId: 'cp-distance',
        sectionKey: 'jurisdiction',
        title: 'Madde 7 — Yetkili Mahkeme',
        content: `İşbu Sözleşmeden doğabilecek uyuşmazlıklarda Tüketici Hakem Heyetleri ile Alıcının veya Satıcının yerleşim yerindeki Tüketici Mahkemeleri yetkilidir.`,
        sortOrder: 7,
        active: true,
      },
    ],
  },
};
