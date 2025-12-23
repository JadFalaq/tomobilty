# Admin Dashboard Access Implementation

## Overview
This document describes the role-based admin dashboard access implementation for the Tomobilty platform.

## Implementation Summary

### 1. Frontend Navigation (Navbar Component)

**Location:** `components/Navbar.tsx`

**Changes Made:**
- Added `Shield` icon import from lucide-react
- Updated role check from lowercase `'admin'` to uppercase `'ADMIN'` to match database schema
- Added Shield icon to admin navigation link
- Implemented conditional rendering: Admin link only appears in DOM when `user.role === 'ADMIN'`
- Applied to both desktop and mobile navigation menus

**Code Example:**
```tsx
{user.role === 'ADMIN' && (
  <Link href="/admin" className="...">
    <Shield className="h-4 w-4" />
    <span>Admin</span>
  </Link>
)}
```

**Security Features:**
- Admin link is NOT rendered in DOM for non-admin users (not just hidden with CSS)
- Uses authoritative user state from localStorage (JWT payload stored after authentication)
- Checks exact role match: `user.role === 'ADMIN'`

---

### 2. Admin Layout Protection

**Location:** `app/admin/layout.tsx`

**Changes Made:**
- Enhanced authorization check with proper error handling
- Implemented three-tier access control:
  1. **Not authenticated** → Redirect to `/connexion?redirect=/admin`
  2. **Authenticated but not ADMIN** → Redirect to `/403` (Forbidden)
  3. **Authenticated as ADMIN** → Grant access
- Added loading state with visual feedback
- Proper try-catch for JSON parsing errors

**Security Flow:**
```
User visits /admin
  ↓
Check localStorage for token & user
  ↓
No token/user → Redirect to login
  ↓
Parse user data
  ↓
role !== 'ADMIN' → Redirect to 403
  ↓
role === 'ADMIN' → Render admin content
```

---

### 3. 403 Forbidden Page

**Location:** `app/403/page.tsx`

**Features:**
- Custom forbidden page with clear messaging
- Shield icon for visual clarity
- Explains access restriction (admin-only)
- Provides navigation options:
  - Return to homepage
  - Go to login page

---

### 4. Admin Dashboard Page

**Location:** `app/admin/page.tsx`

**Changes Made:**
- Updated role check to use uppercase `'ADMIN'`
- Redirects non-admin users to `/403` instead of homepage
- Added error handling for user data parsing
- Fetches dashboard stats from backend API

---

### 5. Backend Route Protection

**Location:** `src/routes/admin.routes.js`

**Security Middleware Stack:**
```javascript
router.use(verifyToken);    // Validates JWT token
router.use(requireAdmin);   // Checks user.role === 'ADMIN'
```

**Middleware Details:**

**`verifyToken`** (`src/middlewares/auth.middleware.js`):
- Validates JWT token from Authorization header
- Fetches user from database
- Attaches user object to `req.user`
- Returns 401 if token invalid/expired

**`requireAdmin`** (`src/middlewares/auth.middleware.js`):
- Checks `req.user.role === 'ADMIN'`
- Returns 403 if user is not admin
- Uses `requireRole(['ADMIN'])` helper

**All admin routes are protected:**
- `/api/admin/dashboard`
- `/api/admin/users`
- Any future admin endpoints

---

## Security Architecture

### Frontend Security
1. **Conditional Rendering:** Admin UI elements don't exist in DOM for non-admins
2. **Route Guards:** Admin layout checks authorization before rendering
3. **Redirect Logic:** Proper redirects based on authentication state
4. **User State Source:** Uses localStorage (populated from JWT after backend authentication)

### Backend Security
1. **JWT Validation:** All admin routes require valid JWT token
2. **Role Verification:** Middleware enforces ADMIN role requirement
3. **Database Lookup:** User role fetched from authoritative source (database)
4. **Layered Protection:** Multiple middleware layers (auth + role check)

### Security Parity
- Frontend restrictions are UX enhancements only
- Backend enforces all authorization rules
- Frontend cannot bypass backend security
- Role stored in JWT is validated against database on each request

---

## Role Enum Definition

**Location:** `prisma/schema.prisma`

```prisma
enum Role {
  CLIENT
  ADMIN
  AGENT

  @@map("role")
}
```

**Important:** Role values are uppercase in database and code.

---

## Testing Checklist

### Frontend Tests
- [ ] Non-authenticated user: Admin link not visible in navbar
- [ ] CLIENT role user: Admin link not visible in navbar
- [ ] ADMIN role user: Admin link visible with Shield icon
- [ ] Non-admin accessing /admin: Redirected to /403
- [ ] Non-authenticated accessing /admin: Redirected to /connexion
- [ ] ADMIN user accessing /admin: Dashboard loads successfully

### Backend Tests
- [ ] No token: 401 Unauthorized
- [ ] Invalid token: 401 Unauthorized
- [ ] Valid token, CLIENT role: 403 Forbidden
- [ ] Valid token, ADMIN role: 200 OK with data

---

## File Changes Summary

### Modified Files
1. `components/Navbar.tsx` - Added role-based admin link with icon
2. `app/admin/layout.tsx` - Enhanced authorization and redirect logic
3. `app/admin/page.tsx` - Updated role check to uppercase ADMIN

### New Files
1. `app/403/page.tsx` - Custom forbidden page
2. `ADMIN_ACCESS_IMPLEMENTATION.md` - This documentation

### Existing Files (Verified)
1. `src/routes/admin.routes.js` - Backend route protection
2. `src/middlewares/auth.middleware.js` - Authentication middleware
3. `prisma/schema.prisma` - Role enum definition

---

## Usage Example

### For Admin Users
1. Login with admin credentials
2. Admin link appears in navigation with Shield icon
3. Click "Admin" to access dashboard
4. Full access to all admin features

### For Non-Admin Users
1. Login with regular credentials
2. No admin link in navigation
3. Direct URL access to /admin redirects to /403
4. Clear message explaining access restriction

---

## Future Enhancements

1. **Granular Permissions:** Extend Admin model to support specific permissions
2. **Audit Logging:** Track admin actions for security
3. **Session Management:** Add token refresh and expiration handling
4. **Multi-Factor Auth:** Additional security for admin accounts
5. **Role Hierarchy:** Support for multiple admin levels

---

## Conventions Followed

1. **Existing Auth System:** Uses current JWT-based authentication
2. **State Management:** Leverages localStorage for user state
3. **Routing:** Follows Next.js App Router patterns
4. **UI Patterns:** Consistent with existing Tailwind/Lucide design
5. **Code Style:** Matches project's TypeScript/JavaScript conventions
6. **Security Best Practices:** Defense in depth, never trust frontend

---

## Contact & Support

For questions or issues related to admin access:
- Check user role in database: `SELECT role FROM users WHERE id = ?`
- Verify JWT token contains correct role claim
- Review browser console for authorization errors
- Check backend logs for authentication failures
