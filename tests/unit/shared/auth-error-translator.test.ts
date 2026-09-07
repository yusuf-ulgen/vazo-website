import { describe, it, expect } from 'vitest';
import { translateAuthError } from '@/shared/utils/auth-error-translator';

describe('Auth Error Translator (Kimlik Doğrulama Hata Çevirici)', () => {
  it('translates invalid login credentials to Turkish', () => {
    expect(translateAuthError('Invalid login credentials')).toBe(
      'Geçersiz e-posta adresi veya şifre.'
    );
    expect(translateAuthError('invalid_grant')).toBe(
      'Geçersiz e-posta adresi veya şifre.'
    );
    expect(translateAuthError(new Error('Invalid login credentials'))).toBe(
      'Geçersiz e-posta adresi veya şifre.'
    );
  });

  it('translates unconfirmed email error', () => {
    expect(translateAuthError('Email not confirmed')).toBe(
      'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.'
    );
  });

  it('translates user already registered error', () => {
    expect(translateAuthError('User already registered')).toBe(
      'Bu e-posta adresiyle kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapmayı deneyiniz.'
    );
  });

  it('translates password length error', () => {
    expect(translateAuthError('Password should be at least 6 characters')).toBe(
      'Şifreniz en az 6 karakter uzunluğunda olmalıdır.'
    );
  });

  it('translates rate limit error', () => {
    expect(translateAuthError('Email rate limit exceeded')).toBe(
      'Güvenliğiniz nedeniyle çok fazla deneme yapıldı. Lütfen birkaç dakika bekledikten sonra tekrar deneyiniz.'
    );
  });

  it('translates session and token expired errors', () => {
    expect(translateAuthError('JWT expired')).toBe(
      'Oturum süreniz doldu. Güvenliğiniz için lütfen yeniden giriş yapınız.'
    );
    expect(translateAuthError('Invalid Refresh Token: Refresh Token Not Found')).toBe(
      'Oturum süreniz doldu. Güvenliğiniz için lütfen yeniden giriş yapınız.'
    );
  });

  it('translates network error', () => {
    expect(translateAuthError('Failed to fetch')).toBe(
      'Sunucuya bağlanırken bir iletişim hatası oluştu. Lütfen internet bağlantınızı kontrol ediniz.'
    );
  });

  it('preserves existing Turkish messages', () => {
    const turkishMsg = 'Lütfen geçerli bir e-posta adresi giriniz.';
    expect(translateAuthError(turkishMsg)).toBe(turkishMsg);
  });

  it('handles null, undefined, and empty inputs gracefully', () => {
    expect(translateAuthError(null)).toBe('Bir hata oluştu. Lütfen tekrar deneyiniz.');
    expect(translateAuthError(undefined)).toBe('Bir hata oluştu. Lütfen tekrar deneyiniz.');
  });
});
