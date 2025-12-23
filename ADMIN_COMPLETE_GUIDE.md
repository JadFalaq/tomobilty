# Admin Dashboard - Complete Implementation Guide

## Overview

This is a **complete, production-ready admin dashboard** for the Tomobilty car rental platform with:

- ✅ **Full CRUD operations** for all 30+ entities
- ✅ **Advanced statistics** and analytics dashboard
- ✅ **Audit logging** for all admin actions
- ✅ **Role-based access control** (RBAC)
- ✅ **Black-on-white UI theme** (as specified)
- ✅ **Search, filters, pagination** on all tables
- ✅ **100+ API endpoints** fully implemented

---

## Architecture

### Backend (Node.js + Express + Prisma)

**Location:** `src/`

```
src/
├── controllers/admin/          # CRUD controllers for all entities
│   ├── stats.admin.controller.js       # Dashboard statistics
│   ├── users.admin.controller.js       # Users CRUD
│   ├── cars.admin.controller.js        # Cars CRUD
│   ├── bookings.admin.controller.js    # Bookings CRUD
│   ├── payments.admin.controller.js    # Payments CRUD
│   ├── invoices.admin.controller.js    # Invoices CRUD
│   ├── reviews.admin.controller.js     # Reviews CRUD
│   ├── maintenance.admin.controller.js # Maintenance CRUD
│   ├── documents.admin.controller.js   # Documents CRUD
│   ├── notifications.admin.controller.js # Notifications CRUD
│   ├── promotions.admin.controller.js  # Promotions CRUD
│   ├── loyalty.admin.controller.js     # Loyalty system CRUD
│   ├── chat.admin.controller.js        # Chat management
│   └── misc.admin.controller.js        # All other entities
├── routes/
│   └── admin.routes.complete.js        # All admin API routes
├── middlewares/
│   ├── auth.middleware.js              # Authentication & RBAC
│   └── audit.middleware.js             # Audit logging
└── utils/
    └── crudHelpers.js                  # Reusable CRUD functions
```

### Frontend (Next.js 14 + TypeScript + Tailwind)

**Location:** `app/admin/`

```
app/admin/
├── layout.tsx                  # Admin layout with navigation
├── page.tsx                    # Dashboard home with stats
├── users/page.tsx              # Users management
├── cars/page.tsx               # Cars management
├── bookings/page.tsx           # Bookings management
├── payments/page.tsx           # Payments management
├── reviews/page.tsx            # Reviews management
├── maintenance/page.tsx        # Maintenance management
├── documents/page.tsx          # Documents management
├── notifications/page.tsx      # Notifications management
├── promotions/page.tsx         # Promotions management
├── loyalty/page.tsx            # Loyalty management
├── chat/page.tsx               # Chat management
└── settings/page.tsx           # System settings
```

**Reusable Components:** `components/admin/`
- `Table.tsx` - Data table with search, pagination, actions
- Black-on-white styling applied throughout

---

## API Endpoints

### Authentication
All admin endpoints require:
```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

User must have `role === 'ADMIN'`

### Dashboard Statistics
```
GET /api/admin/stats
```

Returns comprehensive statistics for all entities including:
- User stats (total, by role, new users)
- Car stats (total, by status, by availability)
- Booking stats (total, by status, recent)
- Payment stats (total amount, completed, failed, refunded)
- Invoice stats (total, by status)
- Reviews (average rating, verified count)
- Maintenance (upcoming, overdue, completed)
- Loyalty (points earned/redeemed, tier distribution)
- Chat (conversations, messages)
- Documents (total, OCR confidence)
- Notifications (total, unread)
- Promotions (active count)
- Time series data for charts
- Recent activity logs

### CRUD Endpoints Pattern

For each entity, the following endpoints are available:

```
GET    /api/admin/<entity>              # List with pagination
GET    /api/admin/<entity>/:id          # Get by ID
POST   /api/admin/<entity>              # Create
PUT    /api/admin/<entity>/:id          # Update
DELETE /api/admin/<entity>/:id          # Delete
```

**Query Parameters for List:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `search` - Search query
- `sortBy` - Field to sort by
- `sortOrder` - 'asc' or 'desc'
- Entity-specific filters (e.g., `status`, `role`, `date_from`, `date_to`)

### Complete Entity List

1. **Users** - `/api/admin/users`
2. **Cars** - `/api/admin/cars`
3. **Car Brands** - `/api/admin/car-brands`
4. **Car Categories** - `/api/admin/car-categories`
5. **Car Images** - `/api/admin/car-images`
6. **Bookings** - `/api/admin/bookings`
7. **Booking Statuses** - `/api/admin/booking-statuses`
8. **Additional Drivers** - `/api/admin/additional-drivers`
9. **Payments** - `/api/admin/payments`
10. **Invoices** - `/api/admin/invoices`
11. **Rental Contracts** - `/api/admin/rental-contracts`
12. **Contract Templates** - `/api/admin/contract-templates`
13. **Reviews** - `/api/admin/reviews`
14. **Maintenance** - `/api/admin/maintenance`
15. **Documents** - `/api/admin/documents`
16. **Notifications** - `/api/admin/notifications`
17. **Promotions** - `/api/admin/promotions`
18. **Loyalty Accounts** - `/api/admin/loyalty/accounts`
19. **Loyalty Tiers** - `/api/admin/loyalty/tiers`
20. **Loyalty Rewards** - `/api/admin/loyalty/rewards`
21. **Loyalty Transactions** - `/api/admin/loyalty/transactions`
22. **Chat Conversations** - `/api/admin/chat/conversations`
23. **Chat Messages** - `/api/admin/chat/messages`
24. **Insurance** - `/api/admin/insurances`
25. **Drivers** - `/api/admin/drivers`
26. **OAuth Accounts** - `/api/admin/oauth-accounts`
27. **Phone Verifications** - `/api/admin/phone-verifications`
28. **System Settings** - `/api/admin/system-settings`
29. **Audit Logs** - `/api/admin/audit-logs`
30. **Admins** - `/api/admin/admins`

---

## Security Features

### 1. Authentication & Authorization

**Middleware Stack:**
```javascript
router.use(verifyToken);    // Validates JWT
router.use(requireAdmin);   // Checks role === 'ADMIN'
```

**Frontend Guards:**
- Admin layout checks authentication on mount
- Redirects to `/connexion` if not authenticated
- Redirects to `/403` if not ADMIN role
- Admin link only visible in navbar for ADMIN users

### 2. Audit Logging

**All admin actions are logged:**
```javascript
router.put('/users/:id', 
  captureOldValues('user'),      // Captures state before change
  auditLog('UPDATE', 'User'),    // Logs the action
  usersController.updateUser
);
```

**Audit Log Fields:**
- `admin_id` - ID of admin who performed action
- `action` - CREATE, UPDATE, DELETE
- `entity_type` - Entity name
- `entity_id` - ID of affected record
- `old_values` - JSON of previous state
- `new_values` - JSON of new state
- `ip_address` - Request IP
- `user_agent` - Browser info
- `created_at` - Timestamp

### 3. Input Validation

**Field Whitelisting:**
```javascript
const allowedFields = ['nom', 'prenom', 'email', ...];
const data = whitelistFields(req.body, allowedFields);
```

**Required Field Validation:**
```javascript
validateRequiredFields(req.body, ['email', 'mot_de_passe']);
```

### 4. Error Handling

- Proper HTTP status codes (401, 403, 404, 400, 500)
- Graceful error messages
- No sensitive data in error responses

---

## UI/UX Features

### Black-on-White Theme

**All admin pages use:**
- Background: `bg-white`
- Text: `text-black`
- Borders: `border-black` or `border-2 border-black`
- Buttons: Black background with white text, inverts on hover
- No gray text (all black for readability)

**Example:**
```tsx
<div className="bg-white border-2 border-black p-4 rounded">
  <h3 className="text-black font-bold">Title</h3>
  <p className="text-black">Content</p>
</div>
```

### Data Tables

**Features:**
- Search functionality
- Pagination (customizable page size)
- Sortable columns
- Action buttons (View, Edit, Delete)
- Loading states
- Empty states
- Responsive design

### Forms & Modals

**Create/Edit modals include:**
- Field validation
- Error messages
- Loading states
- Cancel/Submit buttons
- Black-on-white styling

---

## How to Add a New Entity Module

### 1. Create Backend Controller

**File:** `src/controllers/admin/newentity.admin.controller.js`

```javascript
const { asyncHandler } = require('../../middlewares/errorHandler.middleware');
const { listEntities, getEntityById, createEntity, updateEntity, deleteEntity, validateRequiredFields, whitelistFields } = require('../../utils/crudHelpers');

const allowedFields = ['field1', 'field2', 'field3'];

const listNewEntities = asyncHandler(async (req, res) => {
  const { page, pageSize, search } = req.query;
  
  const result = await listEntities('newEntity', {
    page,
    pageSize,
    search,
    searchFields: ['field1', 'field2'],
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  res.json({ success: true, data: result });
});

const getNewEntityById = asyncHandler(async (req, res) => {
  const entity = await getEntityById('newEntity', req.params.id);
  res.json({ success: true, data: entity });
});

const createNewEntity = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['field1', 'field2']);
  const data = whitelistFields(req.body, allowedFields);
  const entity = await createEntity('newEntity', data);
  res.status(201).json({ success: true, data: entity });
});

const updateNewEntity = asyncHandler(async (req, res) => {
  const data = whitelistFields(req.body, allowedFields);
  const entity = await updateEntity('newEntity', req.params.id, data);
  res.json({ success: true, data: entity });
});

const deleteNewEntity = asyncHandler(async (req, res) => {
  await deleteEntity('newEntity', req.params.id);
  res.json({ success: true, message: 'Entity deleted successfully' });
});

module.exports = {
  listNewEntities,
  getNewEntityById,
  createNewEntity,
  updateNewEntity,
  deleteNewEntity
};
```

### 2. Add Routes

**File:** `src/routes/admin.routes.complete.js`

```javascript
const newEntityController = require('../controllers/admin/newentity.admin.controller');

router.get('/new-entities', newEntityController.listNewEntities);
router.get('/new-entities/:id', newEntityController.getNewEntityById);
router.post('/new-entities', auditLog('CREATE', 'NewEntity'), newEntityController.createNewEntity);
router.put('/new-entities/:id', captureOldValues('newEntity'), auditLog('UPDATE', 'NewEntity'), newEntityController.updateNewEntity);
router.delete('/new-entities/:id', captureOldValues('newEntity'), auditLog('DELETE', 'NewEntity'), newEntityController.deleteNewEntity);
```

### 3. Create Frontend Page

**File:** `app/admin/new-entities/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '@/components/admin/Table';

export default function AdminNewEntities() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [pagination.page]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/new-entities?page=${pagination.page}&pageSize=${pagination.pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'field1', label: 'Field 1' },
    { key: 'field2', label: 'Field 2' },
    // Add more columns
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">New Entities Management</h1>
        <Table
          columns={columns}
          data={items}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
```

### 4. Add Navigation Link

**File:** `app/admin/layout.tsx`

Add to navigation:
```tsx
<a href="/admin/new-entities" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
  New Entities
</a>
```

---

## Testing

### Backend API Testing

```bash
# Get admin stats
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/stats

# List users
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/admin/users?page=1&pageSize=20

# Create user
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","mot_de_passe":"password","role":"CLIENT"}' \
  http://localhost:5000/api/admin/users
```

### Frontend Testing

1. Login as ADMIN user
2. Navigate to http://localhost:3001/admin
3. Verify dashboard loads with stats
4. Test each entity page
5. Test CRUD operations
6. Verify audit logs are created

---

## Performance Optimization

### Backend

1. **Parallel Queries:** Stats endpoint uses `Promise.all()` for concurrent database queries
2. **Pagination:** All list endpoints support pagination to limit data transfer
3. **Indexes:** Database indexes on frequently queried fields (see schema)
4. **Connection Pooling:** Prisma handles connection pooling automatically

### Frontend

1. **Code Splitting:** Next.js automatically splits code by route
2. **Lazy Loading:** Tables only load visible data
3. **Debounced Search:** Search input debounced to reduce API calls
4. **Optimistic Updates:** UI updates before API confirmation for better UX

---

## Deployment

### Environment Variables Required

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api.com/api
```

### Build Commands

```bash
# Backend
npm install
npx prisma generate
npm run api:dev

# Frontend
npm install
npm run build
npm run start
```

---

## Maintenance

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

### Backup Audit Logs

Audit logs should be backed up regularly:
```sql
SELECT * FROM audit_logs WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## Support & Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Check JWT token is valid
- Verify token is in Authorization header
- Check token hasn't expired

**2. 403 Forbidden**
- Verify user role is 'ADMIN' (uppercase)
- Check Admin record exists if using Admin table

**3. CORS Errors**
- Verify FRONTEND_URL in .env matches your frontend URL
- Check CORS middleware configuration

**4. Database Connection Errors**
- Verify DATABASE_URL is correct
- Check database is accessible
- Ensure Prisma client is generated

---

## Summary

This admin dashboard provides:

✅ **Complete CRUD** for all 30+ entities  
✅ **Advanced analytics** with time-series data  
✅ **Full audit trail** of all admin actions  
✅ **Role-based security** on frontend and backend  
✅ **Black-on-white UI** as specified  
✅ **Production-ready** code with error handling  
✅ **Scalable architecture** easy to extend  
✅ **Comprehensive documentation** for maintenance  

The system is fully functional and ready for production use.
