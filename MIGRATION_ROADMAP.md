# Migration Roadmap - Consolidating the Backend Architecture

## Overview
The platform currently has a disconnected backend and frontend:
- **Backend**: Node.js/Express + MongoDB (defined but unused)
- **Frontend**: React + Supabase (fully functional but bypasses backend)

This roadmap outlines the migration path to consolidate the architecture.

---

## Option Analysis

### Option A: Make Backend the Source of Truth (RECOMMENDED)
**Pros:**
- Single source of truth
- Backend controls all business logic & validation
- Better security (no direct DB access from frontend)
- Easier to scale and maintain
- Can implement complex workflows

**Cons:**
- Requires migrating data from Supabase to MongoDB
- Need to build all missing API routes
- More development effort
- Need to update frontend to call API

**Timeline**: 4-6 weeks
**Effort**: High

### Option B: Go Full Supabase (Alternative)
**Pros:**
- No need for backend maintenance
- Real-time out of the box
- Faster to build new features
- Simpler deployment

**Cons:**
- Lose MongoDB models and backend code
- Less control over business logic
- Need to write Supabase RLS policies
- Need to optimize queries for Supabase

**Timeline**: 2-3 weeks
**Effort**: Medium

### Option C: Hybrid Approach (FASTEST)
**Pros:**
- Keep frontend working (no changes)
- Backend becomes an optional API layer
- Can use both databases
- Lower risk

**Cons:**
- Data duplication continues
- Complex sync logic needed
- Harder to maintain long-term
- Doesn't solve the root problem

**Timeline**: 2 weeks (temporary)
**Effort**: Low (but high technical debt)

---

## Recommended Path: Option A - Backend as Source of Truth

### Phase 1: Preparation (Week 1-2)

#### 1.1 Data Audit
- [ ] Export all current Supabase data
- [ ] Map Supabase schema to MongoDB models
- [ ] Identify missing fields/relationships
- [ ] Plan data migration strategy

#### 1.2 Design API Contracts
- [ ] Document all endpoints needed
- [ ] Define request/response formats
- [ ] Plan error handling
- [ ] Design pagination/filtering

**Endpoints to Build:**
```
BUSINESS MANAGEMENT:
  POST   /api/business                - Create business profile
  GET    /api/business/:id            - Get business details
  PUT    /api/business/:id            - Update business
  DELETE /api/business/:id            - Delete business
  GET    /api/business/search         - Search businesses

PRODUCTS:
  POST   /api/business/:id/products   - Add product
  GET    /api/business/:id/products   - List products
  PUT    /api/product/:id             - Update product
  DELETE /api/product/:id             - Delete product

MESSAGING:
  POST   /api/conversations           - Create conversation
  GET    /api/conversations           - List conversations
  POST   /api/conversations/:id/messages - Send message
  GET    /api/conversations/:id/messages - Get messages

RFQS:
  POST   /api/rfq                     - Create RFQ
  GET    /api/rfq                     - List RFQs
  POST   /api/rfq/:id/responses       - Respond to RFQ
  PUT    /api/rfq/:id                 - Update RFQ

UPLOADS:
  POST   /api/upload                  - Upload file
  DELETE /api/upload/:id              - Delete file

NOTIFICATIONS:
  GET    /api/notifications           - Get notifications
  PUT    /api/notifications/:id       - Mark as read
  PUT    /api/notifications/mark-all  - Mark all read

ADMIN:
  GET    /api/admin/users             - List users
  GET    /api/admin/businesses        - List businesses
  PUT    /api/admin/business/:id/verify - Verify business
  PUT    /api/admin/business/:id/suspend - Suspend business
```

#### 1.3 Setup Email System
- [ ] Configure Nodemailer with Gmail/SendGrid
- [ ] Replace email utility stubs with real implementation
- [ ] Test email sending

**Implementation:**
```javascript
// backend/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  // Send email...
};
```

### Phase 2: Backend Development (Week 3-4)

#### 2.1 Implement Business Routes
```javascript
// backend/routes/business.js
router.post('/', auth, requireBusinessOwner, createBusiness);
router.get('/:id', optionalAuth, getBusinessDetails);
router.put('/:id', auth, requireBusinessOwner, updateBusiness);
router.get('/search', searchBusinesses);
```

#### 2.2 Implement Product Routes
```javascript
// backend/routes/products.js
router.post('/:businessId/products', auth, addProduct);
router.get('/:businessId/products', getProducts);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);
```

#### 2.3 Implement Message Routes
```javascript
// backend/routes/messages.js
router.post('/conversations', auth, createConversation);
router.get('/conversations', auth, getConversations);
router.post('/conversations/:id/messages', auth, sendMessage);
router.get('/conversations/:id/messages', auth, getMessages);
```

#### 2.4 File Upload Handler
```javascript
// backend/routes/upload.js - Use multer for S3/local storage
router.post('/', auth, uploadFile);
router.delete('/:id', auth, deleteFile);
```

#### 2.5 Search Implementation
```javascript
// backend/routes/search.js
router.get('/businesses', searchBusinesses);
router.get('/products', searchProducts);
router.get('/rfqs', searchRFQs);
```

### Phase 3: Data Migration (Week 4-5)

#### 3.1 Create Migration Scripts
```javascript
// scripts/migrateData.js
async function migrateBusinesses() {
  // Fetch from Supabase
  // Transform to MongoDB format
  // Insert to MongoDB
}

async function migrateUsers() {
  // Sync Supabase users to MongoDB
}

async function migrateMessages() {
  // Migrate messages and conversations
}

// Run: npm run migrate
```

#### 3.2 Validate Data Integrity
- [ ] Check all records migrated
- [ ] Verify relationships are correct
- [ ] Validate counts and checksums
- [ ] Test critical features

#### 3.3 Setup Backup Strategy
- [ ] Backup Supabase data
- [ ] Backup MongoDB data
- [ ] Document recovery procedures

### Phase 4: Frontend Integration (Week 5-6)

#### 4.1 Create API Client
```typescript
// src/services/api.ts
import { useAuth } from '@/contexts/AuthContext';

class APIClient {
  private baseUrl = import.meta.env.VITE_API_URL;
  
  async request(endpoint: string, options: RequestInit = {}) {
    const { user } = useAuth();
    const token = await user?.getIdToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return response.json();
  }
  
  // Business methods
  getBusinesses() { return this.request('/api/business'); }
  getBusiness(id: string) { return this.request(`/api/business/${id}`); }
  createBusiness(data: any) { return this.request('/api/business', { method: 'POST', body: JSON.stringify(data) }); }
  
  // Add other methods...
}

export const api = new APIClient();
```

#### 4.2 Update Components
```typescript
// Example: Update BusinessEditor component
import { api } from '@/services/api';

export default function BusinessEditor() {
  const handleSave = async (formData) => {
    try {
      await api.updateBusiness(businessId, formData);
      toast.success('Business updated!');
    } catch (error) {
      toast.error('Failed to update');
    }
  };
}
```

#### 4.3 Remove Direct Supabase Calls
- [ ] Replace `supabase.from().select()` with API calls
- [ ] Update hooks to use API client
- [ ] Keep Supabase only for auth and file storage
- [ ] Update real-time subscriptions (move to WebSocket if needed)

#### 4.4 Update AuthContext
```typescript
// Hybrid approach: Use both auth methods
export function AuthProvider() {
  const [user, setUser] = useState(null);
  
  // Keep Supabase for auth
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Sync to backend
      if (session?.user) {
        api.syncUser(session.user);
      }
    });
  }, []);
}
```

### Phase 5: Testing & Optimization (Week 6+)

#### 5.1 Integration Testing
- [ ] Test all API endpoints
- [ ] Test error handling
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Test search functionality

#### 5.2 Performance Testing
- [ ] Load test API endpoints
- [ ] Optimize database queries
- [ ] Add caching where needed
- [ ] Monitor response times

#### 5.3 Security Audit
- [ ] Verify JWT validation
- [ ] Check authorization on all endpoints
- [ ] Test rate limiting
- [ ] Validate input sanitization

### Phase 6: Deployment

#### 6.1 Production Deployment
- [ ] Deploy backend to Render/Railway
- [ ] Configure production database
- [ ] Setup environment variables
- [ ] Configure logging/monitoring

#### 6.2 Frontend Deployment
- [ ] Update API_URL for production
- [ ] Deploy to Vercel/Netlify
- [ ] Update Supabase URLs
- [ ] Setup CDN caching

#### 6.3 Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup performance monitoring
- [ ] Setup uptime monitoring
- [ ] Create runbooks for common issues

---

## Quick Start: Phase 1 Implementation

### Week 1: Planning
1. Create `/docs/API_SPEC.md` - Detailed API documentation
2. Create `/scripts/data_migration.js` - Data migration utilities
3. Plan database schema updates
4. Review security requirements

### Week 2: Email Setup
1. Update `/backend/utils/email.js` with real nodemailer
2. Test email sending
3. Create email templates
4. Setup email verification in auth

---

## Key Files to Create/Modify

### New Files
```
backend/
├── routes/
│   ├── business.js          (NEW)
│   ├── messages.js          (NEW)
│   ├── search.js            (NEW)
│   └── upload.js            (NEW)
├── controllers/
│   ├── businessController.js (NEW)
│   ├── messageController.js  (NEW)
│   └── uploadController.js   (NEW)
├── scripts/
│   └── migrate.js            (NEW)
└── utils/
    └── validators.js         (NEW)

src/
├── services/
│   └── api.ts               (NEW)
├── hooks/
│   ├── useBusiness.ts       (NEW)
│   ├── useMessages.ts       (NEW)
│   └── useSearch.ts         (NEW)
└── utils/
    └── apiHelpers.ts        (NEW)
```

### Modified Files
```
backend/
├── server.js                (Uncomment routes)
├── utils/email.js           (Implement real SMTP)
├── middleware/auth.js       (Add role checks)
└── models/*.js              (Add indexes, methods)

src/
├── contexts/AuthContext.tsx (Add API sync)
├── hooks/useFileUpload.ts   (Update to use API)
├── hooks/useNotifications.ts (Update to use API)
└── components/*.tsx         (Replace Supabase calls)
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All API endpoints designed
- [ ] Email system working
- [ ] Migration scripts created and tested
- [ ] Frontend team aligned on API contracts

### Phase 2 Complete When:
- [ ] All routes implemented
- [ ] All routes tested (unit + integration)
- [ ] Error handling complete
- [ ] Validation complete

### Phase 3 Complete When:
- [ ] Data successfully migrated
- [ ] Data integrity verified
- [ ] Rollback plan tested
- [ ] Zero data loss confirmed

### Phase 4 Complete When:
- [ ] Frontend calls API for all operations
- [ ] All features working
- [ ] Supabase only used for auth + storage
- [ ] Real-time features working

### Phase 5 Complete When:
- [ ] All tests passing
- [ ] Load testing complete
- [ ] Security audit passed
- [ ] Performance acceptable

### Phase 6 Complete When:
- [ ] Backend running in production
- [ ] Frontend deployed
- [ ] Monitoring active
- [ ] Team trained on new system

---

## Risk Mitigation

### Risk: Data Loss During Migration
- **Mitigation**: Multiple backups, dry-run migration, rollback plan
- **Owner**: Database Admin
- **Timeline**: Week 4

### Risk: Downtime During Migration
- **Mitigation**: Blue-green deployment, DNS switch, canary rollout
- **Owner**: DevOps
- **Timeline**: Week 6

### Risk: API Performance Issues
- **Mitigation**: Load testing, caching, query optimization
- **Owner**: Backend Lead
- **Timeline**: Week 5

### Risk: Frontend Breaking Changes
- **Mitigation**: API versioning, feature flags, gradual rollout
- **Owner**: Frontend Lead
- **Timeline**: Weeks 4-6

---

## Communication Plan

### Stakeholders
- [ ] Frontend team
- [ ] Backend team
- [ ] DevOps team
- [ ] QA team
- [ ] Product team

### Weekly Sync
- Every Monday: Progress review
- Every Friday: Blockers & next week planning
- Daily standup: 15 min sync

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Migration guide
- [ ] Rollback procedures
- [ ] Monitoring dashboards

