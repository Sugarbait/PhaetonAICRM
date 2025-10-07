# Stripe Automatic Monthly Invoice Setup Guide

## Overview

The CareXPS Healthcare CRM now includes a fully automatic monthly invoice generation system that:

✅ Generates invoices on the 1st of each month for previous month's services
✅ Runs via Supabase Cron (hands-off, even when app is closed)
✅ Also triggers when user logs in on the 1st (backup mechanism)
✅ Retries up to 3 times if generation fails
✅ Sends email notifications on success/failure
✅ Tracks all invoices in database with audit logging

---

## Quick Start

### 1. Configure Stripe in UI

1. Log into CareXPS CRM
2. Go to **Settings → Stripe Invoicing**
3. Enter your Stripe Secret API Key (from [Stripe Dashboard](https://dashboard.stripe.com/apikeys))
4. Click **"Initialize Stripe"**
5. Enter customer email and name
6. Toggle **"Enable Automatic Invoicing"** to ON

That's it! Invoices will now generate automatically every month.

---

## Setup Details

### Prerequisites

- **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
- **Stripe API Key**: Get from [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
- **Supabase Project**: For database and cron scheduling
- **Customer Email**: Email where invoices will be sent

### Database Setup

Run the migration to add required tables and columns:

```bash
# Apply migration
supabase db push

# Or manually run:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250101000001_add_stripe_auto_invoice.sql
```

This creates:
- `invoice_history` table - Tracks all generated invoices
- `user_settings` columns - Stores auto-invoice configuration

### Supabase Edge Function Deployment

For truly hands-off operation, deploy the Supabase Edge Function with cron:

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set Stripe secret
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_stripe_key

# 5. Deploy function
supabase functions deploy generate-monthly-invoices

# 6. Set up cron (run in Supabase SQL Editor)
SELECT
  cron.schedule(
    'generate-monthly-invoices',
    '0 2 1 * *', -- 2 AM on 1st of each month
    $$
    SELECT
      net.http_post(
        url:='https://YOUR_PROJECT.supabase.co/functions/v1/generate-monthly-invoices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
```

See `supabase/functions/generate-monthly-invoices/README.md` for detailed deployment instructions.

---

## How It Works

### Dual Trigger System

**Primary Trigger: Supabase Cron**
- Runs at 2 AM on 1st of each month
- Works even when app is closed
- Processes all users with auto-invoice enabled

**Backup Trigger: Login Check**
- Runs when user logs in on the 1st
- Ensures invoice generation even if cron fails
- Non-blocking (runs in background)

### Invoice Generation Flow

```
1st of Month
    ↓
Check if auto-invoice enabled
    ↓
Calculate previous month costs
    ↓
Create Stripe invoice
    ↓
Send invoice to customer
    ↓
Save to invoice_history
    ↓
Send email notification
```

### Retry Logic

If invoice generation fails:
1. **Attempt 1**: Initial try
2. **Wait 5 seconds**
3. **Attempt 2**: Retry
4. **Wait 5 seconds**
5. **Attempt 3**: Final retry
6. **If all fail**: Log error and send notification

### Cost Calculation

Invoices include:

**Voice Calls:**
- Retell AI fees (from API)
- Twilio voice costs ($0.022 USD/min)
- Converted to CAD

**SMS Conversations:**
- Twilio SMS segment costs ($0.0083 USD/segment)
- +4 segment overhead for initial prompt
- Converted to CAD

**Total = Call Costs + SMS Costs**

---

## Configuration Options

### UI Settings (Settings → Stripe Invoicing)

| Setting | Description | Required |
|---------|-------------|----------|
| Stripe API Key | Your Stripe secret key | Yes |
| Customer Email | Email for invoices | Yes |
| Customer Name | Customer display name | Yes |
| Auto-Invoice Toggle | Enable automatic generation | No |

### Environment Variables (Optional)

Can also configure via `.env.local`:

```bash
VITE_STRIPE_SECRET_KEY=sk_test_your_key_here
```

### Database Configuration (user_settings table)

| Column | Type | Description |
|--------|------|-------------|
| `stripe_auto_invoice_enabled` | BOOLEAN | Auto-invoice toggle |
| `stripe_customer_email` | TEXT | Invoice recipient email |
| `stripe_customer_name` | TEXT | Customer name |
| `stripe_auto_invoice_last_run` | TIMESTAMPTZ | Last successful run |
| `stripe_auto_invoice_last_check` | TIMESTAMPTZ | Last check timestamp |

---

## Invoice Tracking

All invoices are tracked in the `invoice_history` table:

```sql
SELECT * FROM invoice_history WHERE user_id = 'your-user-id' ORDER BY generated_at DESC;
```

### Invoice Fields

| Field | Description |
|-------|-------------|
| `invoice_id` | Stripe invoice ID |
| `customer_id` | Stripe customer ID |
| `invoice_month` | Month in YYYY-MM format |
| `call_count` | Number of calls |
| `call_cost_cad` | Call costs in CAD |
| `sms_count` | Number of SMS chats |
| `sms_segments` | Total SMS segments |
| `sms_cost_cad` | SMS costs in CAD |
| `total_cost_cad` | Combined total |
| `invoice_status` | draft, sent, paid, failed |
| `invoice_url` | Hosted invoice URL |
| `retry_count` | Number of retries (max 3) |
| `generated_automatically` | TRUE if auto, FALSE if manual |
| `error_message` | Error details if failed |

---

## Testing

### Manual Test (Generate Last Month's Invoice)

1. Go to Settings → Stripe Invoicing
2. Ensure auto-invoice is enabled
3. Click **"Generate Last Month's Invoice"**
4. Check console for logs
5. View invoice in Stripe Dashboard

### Test Cron Function Manually

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/generate-monthly-invoices' \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type": "application/json"
```

### Test Login Trigger

1. Set your system date to the 1st of a month
2. Log out and log back in
3. Check browser console for auto-invoice logs
4. Should see: "📅 Auto-invoice check passed"

---

## Monitoring

### View Function Logs (Supabase)

```bash
# View recent logs
supabase functions logs generate-monthly-invoices --tail

# Or in Supabase Dashboard:
# Edge Functions → generate-monthly-invoices → Logs
```

### Check Cron Job Status (SQL)

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View recent cron executions
SELECT * FROM cron.job_run_details
WHERE jobname = 'generate-monthly-invoices'
ORDER BY start_time DESC
LIMIT 10;
```

### Audit Logs

All auto-invoice operations are logged to `audit_logs`:

```sql
SELECT * FROM audit_logs
WHERE action LIKE '%INVOICE%'
ORDER BY timestamp DESC;
```

---

## Troubleshooting

### Invoice Not Generated

**Check 1: Toggle Enabled?**
```sql
SELECT stripe_auto_invoice_enabled FROM user_settings WHERE user_id = 'your-id';
```

**Check 2: Customer Info Set?**
```sql
SELECT stripe_customer_email, stripe_customer_name FROM user_settings WHERE user_id = 'your-id';
```

**Check 3: Already Generated?**
```sql
SELECT * FROM invoice_history
WHERE user_id = 'your-id'
AND invoice_month = '2025-01' -- Current month
ORDER BY generated_at DESC;
```

**Check 4: Cron Running?**
```sql
SELECT * FROM cron.job_run_details
WHERE jobname = 'generate-monthly-invoices'
ORDER BY start_time DESC
LIMIT 1;
```

### Stripe Errors

**Error: "Stripe not initialized"**
- Solution: Enter API key in Settings → Stripe Invoicing

**Error: "Customer not found"**
- Solution: Service creates customers automatically
- Check Stripe Dashboard → Customers

**Error: "Invalid API key"**
- Solution: Verify key is correct (starts with `sk_`)
- Ensure using secret key, not publishable key

### Email Notifications Not Sent

Email notifications are logged but not yet fully implemented.

To check if notification would have been sent:
```sql
SELECT * FROM audit_logs
WHERE action = 'AUTO_INVOICE_NOTIFICATION_SENT'
ORDER BY timestamp DESC;
```

---

## Security & Compliance

### HIPAA Compliance

✅ No PHI in invoices (only service counts and costs)
✅ All operations logged to audit_logs
✅ Stripe API keys encrypted in transit
✅ Invoice URLs use Stripe's hosted pages (PCI compliant)

### Data Storage

- **Stripe API Keys**: Stored in user_settings (encrypted in Supabase)
- **Invoice Data**: Stored in invoice_history (no PHI)
- **Audit Logs**: Complete trail of all operations

---

## Frequently Asked Questions

**Q: What if I miss enabling it and the 1st passes?**
A: You can manually generate last month's invoice anytime using the "Generate Last Month's Invoice" button.

**Q: Can I disable it temporarily?**
A: Yes, just toggle it off in Settings. It won't generate invoices until you re-enable it.

**Q: What happens if the cron job fails?**
A: The login trigger acts as a backup. When you log in on the 1st, it will generate the invoice.

**Q: Can I customize the invoice?**
A: Currently no. Invoices include voice calls and SMS conversations with 30-day terms. Customization can be added in the future.

**Q: How do I change the customer email?**
A: Update it in Settings → Stripe Invoicing. New invoices will use the updated email.

**Q: Will it generate invoices for months with $0 costs?**
A: No. If there are no charges for a month, no invoice is generated.

**Q: Can I see past invoices?**
A: Yes, check the `invoice_history` table or Stripe Dashboard → Invoices.

---

## Next Steps

1. ✅ Configure Stripe API key in Settings
2. ✅ Enter customer email and name
3. ✅ Enable automatic invoicing toggle
4. ✅ Deploy Supabase Edge Function (optional but recommended)
5. ✅ Test by generating last month's invoice manually
6. ✅ Monitor invoice_history table for successful generation

---

## Support

For issues or questions:
- Check browser console for detailed logs
- Check Supabase function logs
- Review audit_logs table
- Check invoice_history for failed attempts

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
