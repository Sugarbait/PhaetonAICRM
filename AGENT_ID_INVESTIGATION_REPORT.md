# Agent ID Investigation Report - Phaeton AI CRM

**Date:** 2025-10-10
**Issue:** SMS page loading chats from wrong Agent ID (ARTLEE or other tenant)
**Status:** ROOT CAUSE IDENTIFIED

---

## INVESTIGATION FINDINGS

### 1. Database State (Supabase)
**Result:** ✅ CORRECT - No cross-contamination detected

```sql
-- Phaeton AI credentials in database:
tenant_id: 'phaeton_ai'
api_key: EMPTY
call_agent_id: EMPTY
sms_agent_id: EMPTY
metadata: "No hardcoded credentials - users configure their own"
```

**Conclusion:** Database is clean and correctly isolated. Phaeton AI has no configured credentials (as expected).

---

### 2. Credential Loading Chain Analysis

The credential loading follows this priority chain:

```typescript
Priority 1: localStorage (currentUser settings)
  ↓
Priority 2: cloudCredentialService (Supabase database with tenant filter)
  ↓
Priority 3: sessionStorage backup
  ↓
Priority 4: Memory backup
  ↓
Priority 5: Hardcoded fallback (EMPTY for Phaeton AI)
```

**Current behavior:**
- chatService loads credentials via `loadCredentialsAsync()` (lines 297-357 in chatService.ts)
- First checks: `localStorage.getItem('settings_${currentUser.id}')`
- If found, uses those credentials **WITHOUT checking tenant_id**
- This means if a user from ARTLEE/CAREXPS logs into Phaeton AI CRM, their localStorage credentials persist

---

### 3. ROOT CAUSE: localStorage Persistence Across Tenants

**CRITICAL ISSUE FOUND:**

**File:** `src/services/chatService.ts`
**Lines:** 308-319

```typescript
// PRIORITY 1: Try current user's localStorage settings
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
console.log('Chat Service: Loading credentials for user:', currentUser.id)

if (currentUser.id) {
  const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')
  if (settings.retellApiKey) {
    this.apiKey = settings.retellApiKey || ''
    this.smsAgentId = settings.smsAgentId || ''  // ⚠️ NO TENANT CHECK HERE
    console.log('✅ [ChatService TENANT-AWARE] Loaded credentials from current user localStorage')
  }
}
```

**Problem:** This code loads credentials from localStorage WITHOUT verifying the tenant. If a user previously logged into ARTLEE CRM or another tenant on the same browser, those credentials remain in localStorage and get loaded.

---

### 4. Why This Happens

**Scenario:**
1. User logs into **ARTLEE CRM** (tenant_id='artlee') on localhost:3001
2. ARTLEE credentials stored in `localStorage.settings_<user_id>`:
   - `smsAgentId: 'agent_ARTLEE_123'`
3. User switches to **Phaeton AI CRM** (same port, same domain)
4. Logs in with SAME user ID
5. chatService loads credentials from localStorage
6. Finds `smsAgentId: 'agent_ARTLEE_123'`
7. SMS page fetches chats from ARTLEE agent instead of Phaeton AI agent

**Why tenant filtering doesn't help:**
- localStorage credentials don't have `tenant_id` field
- cloudCredentialService has tenant filtering, but it's Priority 2 (only used if localStorage is empty)
- Once localStorage credentials are found, cloudCredentialService is never called

---

## SOLUTION: Multi-Step Fix

### Fix #1: Add Tenant Validation to localStorage Credentials

**File:** `src/services/chatService.ts`
**Location:** Lines 308-340

**Required Change:**
Add tenant validation when loading from localStorage. If credentials don't match current tenant, skip localStorage and use cloudCredentialService.

```typescript
// PRIORITY 1: Try current user's localStorage settings (with tenant validation)
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
const currentTenantId = getCurrentTenantId() // 'phaeton_ai'

if (currentUser.id) {
  const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

  // CRITICAL: Verify credentials belong to current tenant
  if (settings.retellApiKey) {
    // Check if this is the correct tenant's credentials
    // If localStorage doesn't have tenant info, treat as suspect and skip to cloud
    const storedTenantId = settings.tenant_id || currentUser.tenant_id

    if (storedTenantId === currentTenantId) {
      this.apiKey = settings.retellApiKey || ''
      this.smsAgentId = settings.smsAgentId || ''
      console.log('✅ [ChatService TENANT-AWARE] Loaded credentials from localStorage (tenant validated)')
    } else {
      console.warn(`⚠️ [ChatService TENANT-AWARE] localStorage credentials belong to different tenant (${storedTenantId}) - skipping`)
    }
  }
}
```

### Fix #2: Clear localStorage on Tenant Switch

**File:** `src/App.tsx`
**Location:** Application initialization

Add logic to detect tenant mismatch and clear localStorage credentials:

```typescript
useEffect(() => {
  const currentTenantId = getCurrentTenantId()
  const storedTenantId = localStorage.getItem('current_tenant_id')

  if (storedTenantId && storedTenantId !== currentTenantId) {
    console.log(`🔄 Tenant switch detected: ${storedTenantId} → ${currentTenantId}`)
    console.log('🗑️ Clearing old tenant credentials from localStorage')

    // Clear all settings_* entries
    Object.keys(localStorage)
      .filter(key => key.startsWith('settings_'))
      .forEach(key => localStorage.removeItem(key))
  }

  localStorage.setItem('current_tenant_id', currentTenantId)
}, [])
```

### Fix #3: Store Tenant ID with Credentials

**File:** `src/services/retellService.ts`
**Location:** Lines 748-775 (updateLocalStorageCredentials)

Add tenant_id field when storing credentials:

```typescript
private updateLocalStorageCredentials(apiKey?: string, callAgentId?: string, smsAgentId?: string): void {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
    const currentTenantId = getCurrentTenantId()

    if (currentUser.id) {
      const settings = JSON.parse(localStorage.getItem(`settings_${currentUser.id}`) || '{}')

      // Store credentials with tenant_id for validation
      if (apiKey !== undefined) settings.retellApiKey = apiKey
      if (callAgentId !== undefined) settings.callAgentId = callAgentId
      if (smsAgentId !== undefined) settings.smsAgentId = smsAgentId

      // CRITICAL: Add tenant_id to validate credentials later
      settings.tenant_id = currentTenantId
      settings.stored_at = new Date().toISOString()

      localStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(settings))
    }
  } catch (error) {
    console.error('Error updating localStorage credentials:', error)
  }
}
```

---

## IMMEDIATE ACTION REQUIRED

### For Users Experiencing This Issue RIGHT NOW:

**Step 1: Clear localStorage in Browser**
```javascript
// Open browser console and run:
Object.keys(localStorage)
  .filter(key => key.startsWith('settings_'))
  .forEach(key => localStorage.removeItem(key))

console.log('✅ Cleared all localStorage settings')
```

**Step 2: Reload the Page**
- Press Ctrl+Shift+R (hard refresh)
- Or close and reopen browser

**Step 3: Re-configure Credentials**
- Go to Settings > API Configuration
- Enter Phaeton AI's correct credentials:
  - API Key: `key_...` (Phaeton AI's key)
  - Call Agent ID: `agent_...` (Phaeton AI's call agent)
  - SMS Agent ID: `agent_...` (Phaeton AI's SMS agent)
- Save settings

**Step 4: Verify Fix**
- Open SMS page
- Open browser console
- Look for: `"Fresh RetellService - Filtered chats for agent agent_XXX"`
- Verify the agent ID is Phaeton AI's correct agent

---

## TESTING VERIFICATION

After implementing fixes, test these scenarios:

### Test Case 1: Fresh Installation
1. Clear localStorage completely
2. Login to Phaeton AI CRM
3. Configure credentials via Settings
4. Verify SMS page loads Phaeton AI data only

### Test Case 2: Tenant Switch
1. Login to ARTLEE CRM (or any other tenant)
2. Configure ARTLEE credentials
3. Logout from ARTLEE CRM
4. Login to Phaeton AI CRM
5. Verify OLD credentials are NOT loaded
6. Configure Phaeton AI credentials
7. Verify SMS page loads Phaeton AI data only

### Test Case 3: Credential Persistence
1. Configure Phaeton AI credentials
2. Reload page multiple times
3. Verify credentials persist correctly
4. Verify tenant_id is stored with credentials

---

## FILES TO MODIFY

1. **src/services/chatService.ts** (Lines 308-340)
   - Add tenant validation to localStorage credential loading

2. **src/services/retellService.ts** (Lines 748-775)
   - Add tenant_id field when storing credentials

3. **src/App.tsx** (Add new useEffect)
   - Detect tenant switches and clear old credentials

4. **src/config/tenantConfig.ts** (Optional enhancement)
   - Add helper function to validate credential tenant

---

## PRIORITY: CRITICAL

This issue causes **data leakage between tenants** where users from one tenant can see data from another tenant's Retell AI agent. This is a **HIPAA compliance violation** if PHI is involved.

**Immediate mitigation:**
- Clear localStorage on all production instances
- Force users to re-login and re-configure credentials
- Deploy fixes ASAP

---

## ADDITIONAL NOTES

- The tenant isolation fix (commit 42f8708) only addressed database-level isolation
- It did NOT address localStorage credential persistence
- chatService and retellService both need tenant-aware credential loading
- cloudCredentialService already has tenant filtering, but it's not being used when localStorage has credentials

---

**Next Steps:**
1. Implement Fix #1 (tenant validation in chatService)
2. Implement Fix #2 (localStorage clearing on tenant switch)
3. Implement Fix #3 (tenant_id storage with credentials)
4. Test all scenarios
5. Deploy to production
6. Force credential reconfiguration for all users
