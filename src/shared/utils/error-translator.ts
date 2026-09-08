/**
 * Evrensel Hata Çeviri Modülü (Universal Error Translator)
 * Supabase, PostgreSQL, GoTrue Auth, PostgREST, Ağ ve Tarayıcı hata mesajlarını
 * kullanıcı ve yönetici dostu Türkçe metinlere dönüştürür.
 */

export function translateErrorMessage(error: unknown, fallbackMessage = 'Beklenmeyen bir hata oluştu.'): string {
  if (!error) {
    return fallbackMessage;
  }

  let message = '';
  let code = '';

  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
    if ('code' in error && typeof (error as Record<string, unknown>).code === 'string') {
      code = (error as Record<string, unknown>).code as string;
    }
  } else if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;
    message = String(errObj.message || errObj.error_description || errObj.error || '');
    if (typeof errObj.code === 'string') {
      code = errObj.code;
    }
  } else {
    message = String(error);
  }

  const normalized = message.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();

  // 1. PostgREST & RLS Hataları
  if (
    normalized.includes('new row violates row-level security policy') ||
    normalized.includes('violates row-level security policy')
  ) {
    return 'Yetkilendirme kuralı ihlal edildi. Bu işlem için veritabanı erişim veya yazma yetkiniz bulunmuyor.';
  }

  if (
    normalized.includes('cannot coerce the result to a single json object') ||
    normalizedCode === 'PGRST116'
  ) {
    return 'Kayıt bulunamadı veya güncelleme için gerekli veritabanı yetkiniz bulunmuyor.';
  }

  if (normalizedCode === '42501' || normalized.includes('permission denied')) {
    return 'Erişim engellendi. Bu işlem için gerekli izne sahip değilsiniz.';
  }

  // 2. PostgreSQL Kısıtlama (Constraint) Hataları
  if (normalizedCode === '23505' || normalized.includes('duplicate key value violates unique constraint')) {
    if (normalized.includes('slug')) {
      return 'Bu URL uzantısı (slug) zaten başka bir içerik veya kategori tarafından kullanılıyor.';
    }
    if (normalized.includes('sku')) {
      return 'Bu SKU kodu zaten başka bir ürün veya varyant tarafından kullanılıyor.';
    }
    if (normalized.includes('email')) {
      return 'Bu e-posta adresi zaten sistemde kayıtlı.';
    }
    return 'Bu benzersiz kayıt veya anahtar zaten sistemde mevcut.';
  }

  if (normalizedCode === '23503' || normalized.includes('violates foreign key constraint')) {
    return 'İlişkili kayıt bulunamadı veya bu veri başka kayıtlara bağlı olduğu için silinemez.';
  }

  if (normalizedCode === '23502' || normalized.includes('violates not-null constraint')) {
    return 'Zorunlu bir alan boş bırakıldı. Lütfen tüm gerekli bilgileri doldurunuz.';
  }

  if (normalizedCode === '22P02' || normalized.includes('invalid input syntax for type uuid')) {
    return 'Geçersiz kimlik (UUID) formatı iletildi.';
  }

  if (normalized.includes('database outage')) {
    return 'Veritabanı bağlantısı geçici olarak kesildi. Lütfen az sonra tekrar deneyiniz.';
  }

  // 3. Supabase İstemci ve Ortam Değişkeni Hataları
  if (
    normalized.includes('supabase client is not configured') ||
    normalized.includes('missing or invalid vite_supabase_url') ||
    normalized.includes('missing or invalid vite_supabase_publishable_key')
  ) {
    return 'Aktif veritabanı bağlantısı bulunamadı. Supabase yapılandırması eksik veya geçersiz.';
  }

  // 4. Ağ ve Bağlantı Hataları
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('fetch failed') ||
    normalized.includes('network error') ||
    normalized.includes('networkrequestfailed') ||
    normalized.includes('net::err')
  ) {
    return 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
  }

  if (
    normalized.includes('timeout') ||
    normalized.includes('timed out') ||
    normalized.includes('aborted')
  ) {
    return 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyiniz.';
  }

  // 5. Kimlik Doğrulama & Oturum (GoTrue Auth) Hataları
  if (
    normalized.includes('jwt expired') ||
    normalized.includes('token expired') ||
    normalized.includes('session expired')
  ) {
    return 'Oturum süreniz doldu. Lütfen tekrar giriş yapınız.';
  }

  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('invalid username or password') ||
    normalized.includes('invalid password') ||
    normalized.includes('invalid credentials')
  ) {
    return 'Geçersiz e-posta adresi veya şifre.';
  }

  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('unconfirmed_email') ||
    normalized.includes('email_not_confirmed') ||
    normalized.includes('email address not verified')
  ) {
    return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.';
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('user_already_exists') ||
    normalized.includes('already registered') ||
    normalized.includes('email address already in use')
  ) {
    return 'Bu e-posta adresiyle kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapmayı deneyiniz.';
  }

  if (
    normalized.includes('password should be at least') ||
    normalized.includes('password must be at least') ||
    normalized.includes('weak_password') ||
    normalized.includes('password is too short')
  ) {
    return 'Şifreniz en az 6 karakter uzunluğunda olmalıdır.';
  }

  if (normalized.includes('signup requires a valid password')) {
    return 'Kayıt olabilmek için geçerli bir şifre belirlemelisiniz.';
  }

  if (
    normalized.includes('rate limit') ||
    normalized.includes('over_request_rate_limit') ||
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('too many requests')
  ) {
    return 'Güvenliğiniz nedeniyle çok fazla deneme yapıldı. Lütfen birkaç dakika bekledikten sonra tekrar deneyiniz.';
  }

  if (
    normalized.includes('user not found') ||
    normalized.includes('no user found')
  ) {
    return 'Bu bilgilere ait bir kullanıcı hesabı bulunamadı.';
  }

  if (
    normalized.includes('user is banned') ||
    normalized.includes('user_banned')
  ) {
    return 'Bu hesap askıya alınmıştır. Destek ekibiyle iletişime geçiniz.';
  }

  if (
    normalized.includes('invalid email') ||
    normalized.includes('email is invalid') ||
    normalized.includes('unable to validate email')
  ) {
    return 'Lütfen geçerli bir e-posta adresi giriniz.';
  }

  // 6. Supabase Storage Hataları
  if (normalized.includes('bucket not found')) {
    return 'Depolama alanı (Storage Bucket) bulunamadı.';
  }
  if (normalized.includes('the resource was not found') || normalized.includes('object not found')) {
    return 'İstenen dosya depolama alanında bulunamadı.';
  }
  if (normalized.includes('payload too large') || normalized.includes('file size')) {
    return 'Dosya boyutu izin verilen maksimum sınırı aşıyor.';
  }

  // 7. Sık Karşılaşılan "Failed to fetch..." Şablonları
  if (normalized.startsWith('failed to fetch products')) {
    return 'Ürünler veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch product by slug')) {
    return 'Ürün detayı veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch categories')) {
    return 'Kategoriler veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch category')) {
    return 'Kategori detayı veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch collections')) {
    return 'Koleksiyonlar veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch collection')) {
    return 'Koleksiyon detayı veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch announcement')) {
    return 'Duyuru bandı veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch hero')) {
    return 'Hero vitrini veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch split hero')) {
    return 'Split hero vitrini veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch editorial sections')) {
    return 'Editoryal bölümler veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch wholesale benefits')) {
    return 'Ticari avantajlar veritabanından yüklenemedi.';
  }
  if (normalized.startsWith('failed to fetch navigation menu')) {
    return 'Gezinme menüsü veritabanından yüklenemedi.';
  }

  // 8. Eğer mesaj zaten Türkçe ise doğrudan döndür (Türkçe karakter veya belirteç kontrolü)
  // Türkçe karakterler: ç, ğ, ı, ö, ş, ü
  if (/[çğıöşüÇĞİÖŞÜ]/.test(message)) {
    return message;
  }

  // 9. Eğer tamamen İngilizce bir cümle/teknik hata kaldıysa Türkçe'ye çevir veya fallback döndür
  if (normalized.includes('not found')) {
    return 'İstenen kayıt bulunamadı.';
  }
  if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
    return 'Bu işlem için yetkiniz bulunmamaktadır.';
  }

  return message || fallbackMessage;
}

/**
 * Hata mesajını Türkçe ön ek ile biçimlendirir.
 * Örn: formatErrorMessage('Kategori oluşturulamadı', error)
 * Çıktı: "Kategori oluşturulamadı: Yetkilendirme kuralı ihlal edildi..."
 */
export function formatErrorMessage(prefix: string, error: unknown): string {
  const translated = translateErrorMessage(error);
  if (!translated) return prefix;
  if (translated === prefix) return prefix;
  if (prefix.endsWith(':')) {
    return `${prefix} ${translated}`;
  }
  return `${prefix}: ${translated}`;
}
