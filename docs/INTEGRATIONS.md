# Operational Integrations & External Services Checklist

This document provides step-by-step operational setup instructions and configuration checklists for external third-party services in the **Vazo E-Commerce Platform**.

> [!CAUTION]
> **Zero Secrets in Git Policy**:
> Never commit real API keys, merchant secrets, client secrets, or credentials into source control, documentation, pull requests, or issue trackers. All production secrets must be provisioned directly in the **Supabase Dashboard Secrets / Edge Function Secrets** interface.

---

## 1. PayTR Payment Gateway Integration

### 1.1 PayTR Merchant Account Configuration
1. Log in to the [PayTR Merchant Panel](https://www.paytr.com/magaza).
2. Navigate to **Bilgi** (Settings / Integration).
3. Retrieve:
   - `MERCHANT_ID` (Mağaza No)
   - `MERCHANT_KEY` (Mağaza Parolası)
   - `MERCHANT_SALT` (Mağaza Gizli Anahtarı)
4. Set the **Bildirim URL (Callback URL)** in PayTR Merchant Panel:
   ```text
   https://<supabase-project-ref>.supabase.co/functions/v1/paytr-callback
   ```
5. Set the **Dönüş URL (Return URLs)**:
   - Success URL: `https://shop.monocactus.com/checkout/success`
   - Fail URL: `https://shop.monocactus.com/checkout/fail`
6. Disable installments in PayTR panel if requested, or rely on application constraint `no_installment = 1`.

### 1.2 Supabase Edge Function Secrets Provisioning
Execute via Supabase CLI or configure in Supabase Project Settings -> Edge Functions -> Secrets:
```bash
supabase secrets set PAYTR_MERCHANT_ID=<set-as-secret>
supabase secrets set PAYTR_MERCHANT_KEY=<set-as-secret>
supabase secrets set PAYTR_MERCHANT_SALT=<set-as-secret>
supabase secrets set PAYTR_TEST_MODE=1 # Set to 0 in production
```

---

## 2. Google OAuth & Customer Sign-In Setup

### 2.1 Google Cloud Platform Setup
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select project: `Vazo Studio E-Commerce`.
3. Configure the **OAuth Consent Screen**:
   - App Name: `Vazo Studio`
   - User Support Email: `yulgen995@gmail.com`
   - Authorized Domains: `monocactus.com`, `supabase.co`
4. Create **OAuth 2.0 Client Credentials** (Web Application):
   - Authorized JavaScript Origins:
     - `https://shop.monocactus.com`
     - `http://localhost:5173`
   - Authorized Redirect URIs:
     ```text
     https://<supabase-project-ref>.supabase.co/auth/v1/callback
     ```
5. Copy generated `Client ID` and `Client Secret`.

### 2.2 Supabase Auth Provider Setup
1. In Supabase Dashboard, open **Authentication** -> **Providers** -> **Google**.
2. Toggle Google to **Enabled**.
3. Input `Client ID` and `Client Secret`.
4. Save changes.

---

## 3. Transactional Email Infrastructure (Gmail / SMTP Provider)

### 3.1 Sending Identity
- **Development & Testing Sender**: `yulgen995@gmail.com`
- **Sender Name**: `Vazo Studio`

### 3.2 Transactional Email Template Matrix
| Event Trigger | Template Subject | Recipient |
| :--- | :--- | :--- |
| **Order Received & Paid** | `Vazo Studio — Siparişiniz Alındı (#VZ-XXXXX)` | Customer |
| **Payment Failed** | `Vazo Studio — Ödeme İşlemi Tamamlanamadı` | Customer |
| **Order Shipped** | `Vazo Studio — Siparişiniz Kargoya Verildi` (Tracking Link included) | Customer |
| **Order Delivered** | `Vazo Studio — Siparişiniz Teslim Edildi` | Customer |
| **Refund Confirmed** | `Vazo Studio — İade İşleminiz Gerçekleştirildi` | Customer |
| **Trade Application Approved** | `Vazo Studio — Toptan Satış Hesabınız Onaylandı` | Wholesale Customer |

*(Note: Gmail API / OAuth credentials will be configured in a dedicated Phase 3 step. Do not implement credentials in Phase 3.0).*

---

---

## 4. Future E-Archive / E-Invoice Provider (GIB / e-Arsiv)

### 4.1 Integration Blueprint
1. Select accredited Turkish e-Transformation intermediary (e.g., Paraşüt, Bizmu, Trendyol E-Fatura, or Digital Planet).
2. Configure company tax identity:
   - VKN / TCKN
   - Ticaret Sicil No
   - E-İmza / Mali Mühür credentials
3. Scaffolding columns in `orders` (`invoice_status`, `invoice_number`, `invoice_provider`, `invoice_issued_at`) will receive real provider UUIDs and official GIB ETTN tracking codes upon activation.
4. **Honesty Contract**: The application never generates fake GİB documents or fake e-Arşiv PDFs. For pending/unconnected states, the admin panel explicitly displays: *"E-Fatura entegrasyonu henüz bağlı değil (Gelecek Entegrasyon)"*.

---

## 5. Server-Side Integration Readiness Protocol (Booleans Only)

To prevent security risks and information leakage, admin readiness queries (`admin-readiness` Edge Function and `get_checkout_readiness` PostgreSQL RPC) strictly return boolean flags:

```typescript
interface CheckoutReadiness {
  seller_legal_complete: boolean;   // Evaluates 9 mandatory sole proprietor fields
  checkout_enabled: boolean;        // Current state in site_settings.commerce
  has_active_shipping: boolean;     // At least 1 active shipping rate in database
  paytr_secrets_present: boolean;   // Boolean presence of PayTR credentials
  gmail_secrets_present: boolean;   // Boolean presence of SMTP/Gmail credentials
  seller_fields_summary: {
    business_type: boolean;
    owner_full_name: boolean;
    legal_trade_title: boolean;
    tax_office: boolean;
    tax_number: boolean;
    registered_address: boolean;
    kep_address: boolean;
    business_email: boolean;
    business_phone: boolean;
    mersis_number: boolean;         // Informational flag (optional for sole proprietor)
  };
}
```

> [!SECURITY]
> Raw secret values, API keys, or password strings are **never** returned by any readiness endpoint.

---

## 6. Seller Legal Profile Contract & Sole Proprietorship

Under Turkish e-commerce law (ETBİS & 6502 sayılı Kanun):
- **Business Type**: Şahıs firması / sole proprietor.
- **Mandatory Fields (9)**: `business_type`, `owner_full_name`, `legal_trade_title`, `tax_office`, `tax_number`, `registered_address`, `kep_address`, `business_email`, `business_phone`.
- **MERSİS Optionality**: MERSİS numbers are not assigned to sole proprietors without chamber registration. MERSİS is strictly **optional** in validation and does not block checkout activation.
- **Public Profile Page**: Rendered dynamically at `/seller-information` (alias `/satici-bilgileri`) with live data from `site_settings.seller_legal`.

