# Azure Communication Services Email Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Create Azure Communication Services Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource**
3. Search for **"Communication Services"**
4. Click **Create**
5. Fill in:
   - **Subscription**: Your subscription
   - **Resource Group**: Same as your Static Web App
   - **Resource Name**: `carexps-email`
   - **Data Location**: United States
6. Click **Review + Create** → **Create**

### Step 2: Add Email Domain

1. In your Communication Services resource, click **Email** (left sidebar)
2. Click **Try Email**
3. Click **Setup free Azure subdomain**
4. Wait 2-3 minutes for provisioning
5. You'll get a domain like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`

### Step 3: Get Connection String

1. In Communication Services, click **Keys** (left sidebar)
2. Copy the **Primary connection string**
3. It looks like: `endpoint=https://carexps-email.communication.azure.com/;accesskey=xxxxx`

### Step 4: Configure Static Web App

1. Go to your **Static Web App** resource
2. Click **Configuration** → **Application settings**
3. Add new setting:
   - **Name**: `COMMUNICATION_SERVICES_CONNECTION_STRING`
   - **Value**: (paste the connection string from Step 3)
4. Click **Save**

### Step 5: Deploy Updated Code

The code changes will be deployed automatically when you push to GitHub.

---

## Benefits Over SMTP

| Feature | Azure Communication Services | SMTP (Hostinger) |
|---------|----------------------------|------------------|
| **Cost** | FREE (100 emails/month) | Requires email hosting |
| **Configuration** | Connection string only | Password + port + SSL |
| **Reliability** | 99.9% SLA | Depends on provider |
| **Azure Integration** | Native | External service |
| **Environment Variables** | Works in Static Web Apps | Doesn't work properly |
| **Setup Time** | 5 minutes | Already spent hours troubleshooting |

---

## Code Changes Needed

I'll update the Azure Function to use Azure Communication Services SDK instead of nodemailer.

This will:
- Remove dependency on SMTP passwords
- Use Azure-native email sending
- Work reliably in Azure Static Web Apps
- Be production-ready immediately

---

## Next Steps

1. Create Azure Communication Services resource (5 minutes)
2. Get connection string
3. Add to Static Web App configuration
4. Deploy code changes (I'll do this)
5. Test email notifications (will work immediately)

**Total Time**: 5-10 minutes
**Cost**: FREE
**Reliability**: 99.9% SLA

Let me know when you've completed Steps 1-4, and I'll deploy the code changes to use Azure Communication Services.
