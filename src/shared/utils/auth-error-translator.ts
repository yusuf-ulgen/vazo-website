/**
 * Kimlik doğrulama hata mesajlarını kullanıcı dostu Türkçe metinlere dönüştüren yardımcı modül.
 * Supabase GoTrue, OAuth ve tarayıcı hata mesajlarını kapsar.
 */

export function translateAuthError(error: unknown): string {
  if (!error) {
    return 'Bir hata oluştu. Lütfen tekrar deneyiniz.';
  }

  let message = '';
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }

  const normalized = message.trim().toLowerCase();

  // 1. Geçersiz giriş bilgileri (Invalid login credentials)
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_grant') ||
    normalized.includes('invalid username or password') ||
    normalized.includes('invalid password') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('database error finding user')
  ) {
    return 'Geçersiz e-posta adresi veya şifre.';
  }

  // 2. Doğrulanmamış e-posta adresi
  if (
    normalized.includes('email not confirmed') ||
    normalized.includes('unconfirmed_email') ||
    normalized.includes('email_not_confirmed') ||
    normalized.includes('email address not verified')
  ) {
    return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.';
  }

  // 3. Kullanıcı zaten kayıtlı
  if (
    normalized.includes('user already registered') ||
    normalized.includes('user_already_exists') ||
    normalized.includes('already registered') ||
    normalized.includes('email address already in use') ||
    normalized.includes('already exists')
  ) {
    return 'Bu e-posta adresiyle kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapmayı deneyiniz.';
  }

  // 4. Şifre uzunluğu ve kuralları
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

  // 5. Çok fazla istek / Rate limit
  if (
    normalized.includes('rate limit') ||
    normalized.includes('over_request_rate_limit') ||
    normalized.includes('over_email_send_rate_limit') ||
    normalized.includes('too many requests')
  ) {
    return 'Güvenliğiniz nedeniyle çok fazla deneme yapıldı. Lütfen birkaç dakika bekledikten sonra tekrar deneyiniz.';
  }

  // 6. Kullanıcı bulunamadı veya askıya alındı
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

  // 7. Geçersiz e-posta formatı
  if (
    normalized.includes('invalid email') ||
    normalized.includes('email is invalid') ||
    normalized.includes('unable to validate email')
  ) {
    return 'Lütfen geçerli bir e-posta adresi giriniz.';
  }

  // 8. Oturum ve token süre aşımı
  if (
    normalized.includes('jwt expired') ||
    normalized.includes('token is expired') ||
    normalized.includes('session expired') ||
    normalized.includes('refresh token not found') ||
    normalized.includes('user from sub claim in jwt does not exist') ||
    normalized.includes('auth session missing')
  ) {
    return 'Oturum süreniz doldu. Güvenliğiniz için lütfen yeniden giriş yapınız.';
  }

  // 9. Ağ ve bağlantı hataları
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network error') ||
    normalized.includes('networkrequestfailed') ||
    normalized.includes('connection refused')
  ) {
    return 'Sunucuya bağlanırken bir iletişim hatası oluştu. Lütfen internet bağlantınızı kontrol ediniz.';
  }

  // 10. OAuth / Google iptal ve reddi
  if (
    normalized.includes('access_denied') ||
    normalized.includes('user cancelled') ||
    normalized.includes('popup closed') ||
    normalized.includes('popup_closed_by_user')
  ) {
    return 'Giriş işlemi iptal edildi veya yetkilendirme reddedildi.';
  }

  // 11. Veritabanı veya sunucu hatası
  if (normalized.includes('database error') || normalized.includes('unexpected_failure')) {
    return 'İşlem sırasında bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyiniz.';
  }

  // 12. Halihazırda Türkçe bir mesajsa doğrudan döndür
  if (
    /[çğıöşüÇĞİÖŞÜ]/.test(message) ||
    message.includes('Lütfen') ||
    message.includes('Geçersiz') ||
    message.includes('oluştu')
  ) {
    return message;
  }

  return message.length > 0
    ? message
    : 'Giriş işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol ediniz.';
}
