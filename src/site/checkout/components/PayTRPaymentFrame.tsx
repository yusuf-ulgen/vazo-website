import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle, Loader2, CreditCard } from 'lucide-react';

interface PayTRPaymentFrameProps {
  iframeUrl: string;
  isTestMode?: boolean;
  onPaymentSuccessRedirect?: () => void;
}

export function PayTRPaymentFrame({
  iframeUrl,
  isTestMode = false,
}: PayTRPaymentFrameProps) {
  // PayTR in test mode with yellow banner & installment table requires ~800-880px to prevent button clipping
  const [iframeHeight, setIframeHeight] = useState<number>(880);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 1. Listen for PayTR iframe auto-resizing messages
    const handleMessage = (event: MessageEvent) => {
      // Security: PayTR iframe communication
      if (typeof event.origin === 'string' && event.origin.includes('paytr.com')) {
        if (typeof event.data === 'number' && event.data > 200 && event.data < 3000) {
          setIframeHeight(event.data);
        } else if (typeof event.data === 'string') {
          // Standard JSON payload
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && typeof parsed.height === 'number' && parsed.height > 200 && parsed.height < 3000) {
              setIframeHeight(parsed.height);
              return;
            }
          } catch {
            // Ignore non-JSON postMessage
          }

          // PayTR / David Bradshaw iframe-resizer protocol: [iFrameSizer]id:height:width:...
          if (event.data.startsWith('[iFrameSizer]')) {
            const parts = event.data.split(':');
            for (let i = 1; i < Math.min(parts.length, 4); i++) {
              const part = parts[i];
              if (part) {
                const h = parseInt(part, 10);
                if (!isNaN(h) && h > 200 && h < 3000) {
                  setIframeHeight(h);
                  break;
                }
              }
            }
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // 2. Load PayTR official iframe-resizer helper if available in browser
    if (typeof window !== 'undefined') {
      const scriptId = 'paytr-iframe-resizer';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://www.paytr.com/js/iframeResizer.min.js';
        script.async = true;
        script.onload = () => {
          // @ts-expect-error - iFrameResize injected by PayTR library
          if (typeof window.iFrameResize === 'function') {
            // @ts-expect-error - iFrameResize invocation
            window.iFrameResize({}, '#paytriframe');
          }
        };
        document.body.appendChild(script);
      } else {
        // @ts-expect-error - iFrameResize already loaded
        if (typeof window.iFrameResize === 'function') {
          // @ts-expect-error - iFrameResize invocation
          window.iFrameResize({}, '#paytriframe');
        }
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Test Mode Notification Banner with Test Card Helper */}
      {isTestMode && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xs space-y-2 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>PayTR Test Modu: Gerçek kart çekimi yapılmaz. Test kartı kullanarak güvenle işlem yapabilirsiniz.</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
            Canlı moda geçiş için bu sayfadaki test ödemesini aşağıdaki test kartı ile tamamlayıp PayTR Mağaza Panelinden <strong>&quot;Tekrar Kontrol Et&quot;</strong> butonuna basmanız gerekmektedir.
          </p>
          <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 opacity-80" />
              <span>Kart No: <strong>4355 0843 5508 4358</strong></span>
            </div>
            <div>SKT: <strong>12/28</strong></div>
            <div>CVV: <strong>123</strong></div>
            <div>3D Şifre: <strong>123456</strong></div>
          </div>
        </div>
      )}

      {/* Security Assurance Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-muted border border-border-subtle rounded-xs text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-feedback-success shrink-0" />
          <span>256-Bit SSL & 3D Secure Güvenli Ödeme Penceresi</span>
        </div>
        <span className="text-[11px] text-text-muted font-mono">PayTR Direct iFrame</span>
      </div>

      {/* Frame Container */}
      <div className="relative border border-border-default rounded-sm bg-surface-primary transition-all duration-300 min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-primary/90 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-text-primary" />
            <span className="text-xs text-text-secondary">Güvenli ödeme formu yükleniyor...</span>
          </div>
        )}

        <iframe
          ref={frameRef}
          src={iframeUrl}
          title="Güvenli PayTR ödeme formu"
          id="paytriframe"
          frameBorder="0"
          scrolling="auto"
          style={{ width: '100%', height: `${iframeHeight}px`, minHeight: '750px' }}
          className="w-full border-0 transition-opacity duration-300"
          onLoad={() => {
            setIsLoading(false);
            // @ts-expect-error - iFrameResize hook on iframe load
            if (typeof window.iFrameResize === 'function') {
              // @ts-expect-error - iFrameResize invocation
              window.iFrameResize({}, '#paytriframe');
            }
          }}
        />
      </div>
    </div>
  );
}
