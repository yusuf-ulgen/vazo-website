import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '@/shared/lib/supabase';
import { getAndClearAuthRedirect } from '@/shared/lib/safe-redirect';
import { customerAuthStore } from '@/shared/stores/customer-auth-store';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';

/**
 * Handles the OAuth redirect callback from Supabase and Google.
 * Securely extracts session, resolves intended redirect destination, and navigates.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        const client = getSupabase();
        
        // Retrieve current session from URL tokens
        const { data, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (data?.session?.user) {
          await customerAuthStore.refresh();
          const targetUrl = getAndClearAuthRedirect('/account');
          if (isMounted) {
            navigate(targetUrl, { replace: true });
          }
        } else {
          // Listen once for auth state if session hasn't settled yet
          const { data: authSubscription } = client.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                authSubscription.subscription.unsubscribe();
                await customerAuthStore.refresh();
                const targetUrl = getAndClearAuthRedirect('/account');
                if (isMounted) {
                  navigate(targetUrl, { replace: true });
                }
              }
            }
          );

          // Safety timeout in case callback was hit directly without auth payload
          setTimeout(() => {
            if (isMounted && !client.auth.getUser()) {
              navigate('/account', { replace: true });
            }
          }, 3000);
        }
      } catch (err: unknown) {
        if (isMounted) {
          let msg = 'Giriş işlemi tamamlanırken beklenmedik bir hata oluştu.';
          if (err instanceof Error) {
            msg = err.message;
          } else if (typeof err === 'object' && err !== null && 'message' in err) {
            msg = String((err as { message: unknown }).message);
          }
          setError(msg);
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <Section className="py-24">
        <Container size="sm">
          <div className="bg-surface-primary border border-border-default p-8 text-center space-y-6 shadow-card animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-feedback-danger-surface text-feedback-danger flex items-center justify-center mx-auto border border-feedback-danger/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-text-primary">Giriş Başarısız Oldu</h2>
              <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
                {error}
              </p>
            </div>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-action-primary text-action-primary-text text-xs uppercase font-semibold tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section className="py-28">
      <Container size="sm">
        <div className="bg-surface-primary border border-border-default p-12 text-center space-y-6 shadow-card animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-surface-secondary text-text-primary flex items-center justify-center mx-auto border border-border-subtle">
            <LoaderCircle className="w-6 h-6 animate-spin text-text-secondary" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
              Kimlik Doğrulama
            </span>
            <h2 className="font-display text-2xl text-text-primary">Oturum Açılıyor</h2>
            <p className="text-xs text-text-secondary">
              Google hesabınız doğrulanıyor, lütfen bekleyiniz...
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
