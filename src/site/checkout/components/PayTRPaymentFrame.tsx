import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface PayTRPaymentFrameProps {
  iframeUrl: string;
  isTestMode?: boolean;
  onPaymentSuccessRedirect?: () => void;
}

export function PayTRPaymentFrame({
  iframeUrl,
  isTestMode = false,
}: PayTRPaymentFrameProps) {
  const [iframeHeight, setIframeHeight] = useState<number>(600);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for PayTR iframe auto-resizing messages
    const handleMessage = (event: MessageEvent) => {
      // Security: PayTR iframe communication
      if (typeof event.origin === 'string' && event.origin.includes('paytr.com')) {
        if (typeof event.data === 'number' && event.data > 200 && event.data < 3000) {
          setIframeHeight(event.data);
        } else if (typeof event.data === 'string') {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && typeof parsed.height === 'number') {
              setIframeHeight(parsed.height);
            }
          } catch {
            // Ignore non-JSON postMessage
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Test Mode Notification Banner */}
      {isTestMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xs flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>PayTR Test Modu:</strong> Gerçek kart çekimi yapılmaz. Test kartı kullanarak güvenle işlem yapabilirsiniz.
          </span>
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
      <div className="relative border border-border-default rounded-sm bg-surface-primary overflow-hidden transition-all duration-300 min-h-[450px]">
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
          scrolling="no"
          style={{ width: '100%', height: `${iframeHeight}px` }}
          className="w-full border-0 transition-opacity duration-300"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
