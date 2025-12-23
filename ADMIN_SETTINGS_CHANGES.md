# Admin Settings - Implementation Summary

## Overview
Replaced the global SystemSettings CRUD module with a per-admin "My Settings" page where each admin can only view and update their own profile and preferences.

---

## Changes Made

### 1. Database Schema Changes

**File:** `prisma/schema.prisma`

**Added new model:**
```prisma
model AdminSettings {
  id                        Int      @id @default(autoincrement())
  user_id                   Int      @unique
  language                  String?  @default("fr")
  timezone                  String?  @default("Africa/Casablanca")
  notification_email        Boolean  @default(true)
  notification_sms          Boolean  @default(false)
  dashboard_default_range   String?  @default("7d")
  created_at                DateTime @default(now())
  updated_at                DateTime @updatedAt
  user                      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

**Updated User model:**
- Added `adminSettings AdminSettings?` relation

**Migration required:**
```bash
npx prisma migrate dev --name add_admin_settings
npx prisma generate
```

---

### 2. Backend API Changes

**New Controller:** `src/controllers/admin/me.admin.controller.js`

**Endpoints added:**
- `GET /api/admin/me/settings` - Get current admin's profile and preferences
- `PUT /api/admin/me/settings` - Update current admin's profile and preferences
- `PUT /api/admin/me/password` - Change current admin's password

**Security features:**
- All endpoints require authentication + ADMIN role
- User ID always taken from JWT token (never from request body)
- Field whitelisting for profile updates (nom, prenom, telephone, adresse)
- Field whitelisting for preferences updates
- Password strength validation (minimum 8 characters)
- Current password verification before change
- Audit logging on all update operations

**Routes updated:** `src/routes/admin.routes.complete.js`
- Added import for `meController`
- Added three new routes under "ADMIN SELF-SETTINGS (ME)" section

---

### 3. Frontend Changes

**New Page:** `app/admin/settings/page.tsx`

**Features:**
- **Profile Section:** Edit name, phone, address (email display-only)
- **Preferences Section:**
  - Language selection (Français, English, العربية)
  - Timezone selection
  - Dashboard default date range (7d/30d/90d)
  - Email notification toggle
  - SMS notification toggle
- **Security Section:**
  - Change password with current password verification
  - Password confirmation
  - Minimum 8 character validation
- **UI Styling:** Black text on white background throughout
- **Success/Error Messages:** User-friendly feedback
- **Auto-creation:** Settings are created automatically on first access if they don't exist

**Navigation updated:** `app/admin/layout.tsx`
- Added "Paramètres" button in top-right navigation
- Styled with white background, black text, hover effects

**Removed:**
- Deleted `app/admin/settings/page.tsx` (old SystemSettings page)
- SystemSettings is no longer accessible from admin UI

---

## Data Model Details

### AdminSettings Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | Int | Auto | Primary key |
| `user_id` | Int | - | Foreign key to User (unique) |
| `language` | String | "fr" | Interface language |
| `timezone` | String | "Africa/Casablanca" | User timezone |
| `notification_email` | Boolean | true | Email notifications enabled |
| `notification_sms` | Boolean | false | SMS notifications enabled |
| `dashboard_default_range` | String | "7d" | Default dashboard date range |
| `created_at` | DateTime | now() | Creation timestamp |
| `updated_at` | DateTime | now() | Last update timestamp |

---

## Security Implementation

### Authentication & Authorization
- ✅ All endpoints require `verifyToken` middleware
- ✅ All endpoints require `requireAdmin` middleware
- ✅ User ID extracted from JWT token (`req.user.id`)
- ✅ No user can access another user's settings

### Input Validation
- ✅ Profile fields whitelisted: `nom`, `prenom`, `telephone`, `adresse`
- ✅ Preference fields whitelisted: `language`, `timezone`, `notification_email`, `notification_sms`, `dashboard_default_range`
- ✅ Email field is read-only (cannot be changed)
- ✅ Password strength validation (min 8 chars)
- ✅ Current password verification required

### Audit Logging
- ✅ Settings updates logged with `auditLog('UPDATE', 'AdminSettings')`
- ✅ Password changes logged with `auditLog('UPDATE', 'Password')`

---

## API Usage Examples

### Get Current Admin Settings
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/admin/me/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": 1,
      "nom": "Doe",
      "prenom": "John",
      "email": "admin@example.com",
      "telephone": "+212600000000",
      "adresse": "Casablanca, Morocco",
      "role": "ADMIN"
    },
    "preferences": {
      "language": "fr",
      "timezone": "Africa/Casablanca",
      "notification_email": true,
      "notification_sms": false,
      "dashboard_default_range": "7d"
    }
  }
}
```

### Update Settings
```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "nom": "Smith",
      "telephone": "+212611111111"
    },
    "preferences": {
      "language": "en",
      "notification_email": false,
      "dashboard_default_range": "30d"
    }
  }' \
  http://localhost:5000/api/admin/me/settings
```

### Change Password
```bash
curl -X PUT -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }' \
  http://localhost:5000/api/admin/me/password
```

---

## Testing Checklist

- [ ] Run database migration
- [ ] Restart backend server
- [ ] Login as ADMIN user
- [ ] Navigate to /admin/settings
- [ ] Verify profile fields load correctly
- [ ] Update profile information and save
- [ ] Update preferences and save
- [ ] Change password with correct current password
- [ ] Try changing password with wrong current password (should fail)
- [ ] Try password less than 8 characters (should fail)
- [ ] Verify audit logs are created for updates
- [ ] Verify non-admin users cannot access /api/admin/me/settings

---

## Migration Steps

1. **Update schema:**
   ```bash
   # Schema already updated in prisma/schema.prisma
   ```

2. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_admin_settings
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Restart backend:**
   ```bash
   npm run api:dev
   ```

5. **Test the new settings page:**
   - Navigate to http://localhost:3001/admin/settings
   - Update profile and preferences
   - Change password

---

## Notes

- Settings are automatically created with default values on first access
- Email field cannot be changed (security measure)
- Old SystemSettings CRUD has been removed from navigation
- All changes are audit-logged for compliance
- The page is fully responsive and follows the black-on-white theme
- Password changes require current password verification
- Settings are scoped per-admin (each admin only sees their own)

---

## Future Enhancements (Optional)

- Add 2FA settings
- Add session management (view/revoke active sessions)
- Add API key management for integrations
- Add email change with verification
- Add profile picture upload
- Add activity log viewer (personal audit trail)
