import type { CartItem } from '@/shared/stores/cart-store';

/**
 * Replaces technical database UUIDs in checkout error messages
 * with user-friendly product and variant names from the cart.
 */
export function formatCheckoutError(
  rawError: string | null | undefined,
  cartItems: CartItem[]
): string {
  if (!rawError) return '';

  let message = rawError;

  // Replace any variantId found in cart items with human-readable name
  for (const item of cartItems) {
    if (item.variantId && message.includes(item.variantId)) {
      const variantName = item.variantName || item.colorName;
      const displayLabel = variantName
        ? `"${item.productName} (${variantName})"`
        : `"${item.productName}"`;
      message = message.split(item.variantId).join(displayLabel);
    }
  }

  // Clean up and humanize the specific variant error pattern
  if (message.includes('Varyant bulunamadı veya aktif değil:')) {
    message = message.replace(
      /Varyant bulunamadı veya aktif değil:\s*(.+)/i,
      'Seçilen $1 ürünü şu anda aktif değil veya satışa kapalı. Lütfen sepetinizden kaldırarak devam ediniz.'
    );
  }

  return message;
}
