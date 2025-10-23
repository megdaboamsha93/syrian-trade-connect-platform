# Quick Reference - Architecture Summary

## TL;DR - The Situation

You have a **disconnected backend and frontend**:

| Component | Technology | Status | Used By |
|-----------|-----------|--------|---------|
| **Backend API** | Node.js/Express | Implemented | Frontend (NOT) |
| **Backend Database** | MongoDB Atlas | Models defined | Unused |
| **Frontend** | React + Vite | Fully working | Users ✓ |
| **Frontend Database** | Supabase PostgreSQL | Fully integrated | Frontend ✓ |
| **Authentication** | Dual (JWT + Supabase) | Both working | Conflict! |

**The Problem**: Frontend bypasses backend and uses Supabase directly. Backend code is orphaned.

**The Solution**: Consolidate architecture (see MIGRATION_ROADMAP.md)

---

## Current State

### What Works
✓ User signup/login (in Supabase)
✓ Business profiles (in Supabase)
✓ Messaging (models in MongoDB, not used)
✓ Real-time notifications (Supabase)
✓ File uploads (Supabase storage)
✓ RFQ system (Supabase)
✓ Orders & Logistics (Supabase)

### What Doesn't Work
✗ Backend API endpoints (commented out)
✗ Email verification (console logs only)
✗ Password reset emails (console logs only)
✗ Backend auth middleware (frontend doesn't use)
✗ Data sync between MongoDB and Supabase

---

## API Endpoints (Currently Implemented)

### Authentication (`/api/auth`)
```
POST   /register              Register new user
POST   /login                 Login with email/password
GET    /verify-email/:token   Verify email address
POST   /forgot-password       Request password reset
POST   /reset-password/:token Reset password with token
GET    /me                    Get current user profile
PATCH  /me                    Update user profile
POST   /change-password       Change password
POST   /deactivate            Deactivate account
```

### Health Check
```
GET    /api/health            Server status
```

### Not Implemented (Commented Out)
- `/api/business/*` - Business CRUD
- `/api/messages/*` - Messaging system
- `/api/search/*` - Search functionality
- `/api/upload/*` - File uploads

---

## Database Schemas

### MongoDB Collections (Backend - Defined but Not Used)
1. **users** - Auth users with email/password
2. **businesses** - Business profiles with products
3. **messages** - Messages with metadata
4. **conversations** - Conversations with participants

### Supabase Tables (Frontend - Fully Used)
1. **profiles** - User profiles
2. **businesses** - Business listings
3. **business_products** - Product listings
4. **rfq_requests** - RFQ requests
5. **rfq_responses** - RFQ responses
6. **orders** - Orders from RFQs
7. **logistics_providers** - Logistics companies
8. **conversations** - Message conversations
9. **messages** - Messages
10. **notifications** - System notifications
11. **user_interests** - User preferences
12. And 10+ more tables for analytics, verification, etc.

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB Atlas (via Mongoose 8.0.3)
- **Auth**: JWT + bcryptjs
- **Key Packages**: helmet, cors, rate-limit, express-validator, multer

### Frontend
- **Framework**: React 18.3.1
- **Build**: Vite 5.4.1
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
VITE_SUPABASE_PROJECT_ID=your-id
```

### Backend (backend/.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@...
```

---

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/server.js` | Express server entry point |
| `backend/routes/auth.js` | Auth endpoints |
| `backend/models/User.js` | User schema |
| `backend/models/Business.js` | Business schema |
| `backend/models/Message.js` | Message schema |
| `backend/models/Conversation.js` | Conversation schema |
| `backend/middleware/auth.js` | JWT middleware |
| `backend/utils/email.js` | Email utility (stubbed) |

### Frontend
| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | Supabase auth |
| `src/integrations/supabase/client.ts` | Supabase client |
| `src/integrations/supabase/types.ts` | Database types |
| `src/hooks/useFileUpload.ts` | File upload logic |
| `src/hooks/useNotifications.ts` | Notification management |
| `src/pages/Login.tsx` | Login page |
| `src/pages/MyBusiness.tsx` | Business profile page |

---

## How to Run

### Backend
```bash
cd backend
npm install
npm run dev          # Runs on http://localhost:5000
```

### Frontend
```bash
npm install
npm run dev          # Runs on http://localhost:8080
```

---

## Next Steps (Recommended Order)

### Immediate (This Week)
1. Read `ARCHITECTURE_ANALYSIS.md` - Understand current state
2. Read `ARCHITECTURE_DIAGRAM.txt` - Visual overview
3. Review `MIGRATION_ROADMAP.md` - Plan the migration

### Short Term (Next 2 Weeks)
1. **Option 1**: Implement missing backend routes (business, messages, etc.)
2. **Option 2**: Setup email system (real SMTP)
3. **Option 3**: Create API client in frontend

### Medium Term (Weeks 3-6)
1. Build all API endpoints
2. Create migration scripts
3. Migrate data from Supabase to MongoDB
4. Update frontend to call API instead of Supabase

### Long Term (Weeks 6+)
1. Deploy to production
2. Setup monitoring
3. Optimize performance
4. Add new features

---

## Critical Issues to Address

### 1. Email System Not Working
- **Current**: Emails logged to console
- **Fix**: Setup Nodemailer with Gmail/SendGrid
- **Impact**: Email verification and password resets won't work
- **Effort**: 2-4 hours

### 2. Backend API Routes Missing
- **Current**: Only auth endpoints implemented
- **Fix**: Implement business, message, search, upload routes
- **Impact**: Frontend can't use backend for anything except auth
- **Effort**: 2-3 weeks

### 3. Data in Two Places
- **Current**: User data in MongoDB, everything else in Supabase
- **Fix**: Consolidate to one database
- **Impact**: Data inconsistency, hard to maintain
- **Effort**: 1-2 weeks

### 4. Frontend Bypasses Backend
- **Current**: Frontend calls Supabase directly
- **Fix**: Frontend should call backend API
- **Impact**: No backend protection/validation
- **Effort**: 1-2 weeks

---

## Architecture Decision Tree

```
START: Consolidate Architecture?
│
├─ YES, make backend the source of truth
│   ├─ Effort: HIGH (4-6 weeks)
│   ├─ Benefit: Single source of truth, better security
│   ├─ Risk: Data migration, frontend changes
│   └─ RECOMMENDED for long-term
│
├─ YES, use Supabase directly (no backend)
│   ├─ Effort: MEDIUM (2-3 weeks)
│   ├─ Benefit: Simpler, faster development
│   ├─ Risk: Lose backend code, less control
│   └─ Good for MVP/rapid iteration
│
└─ NO, keep both (hybrid approach)
    ├─ Effort: LOW (temporary)
    ├─ Benefit: Keep everything working
    ├─ Risk: Technical debt, harder to maintain
    └─ NOT RECOMMENDED (temporary fix only)
```

---

## Commands Cheatsheet

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start development server
npm run seed            # Seed database
npm test                # Run tests
npm run build           # Build for production
```

### Frontend
```bash
npm install             # Install dependencies
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Database
```bash
# MongoDB
npm run migrate        # Run migration (if implemented)
npm run seed          # Seed with sample data (if implemented)

# Supabase
# Use Supabase dashboard or CLI
```

---

## Useful Links

### Documentation
- [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) - Detailed analysis
- [ARCHITECTURE_DIAGRAM.txt](./ARCHITECTURE_DIAGRAM.txt) - Visual overview
- [MIGRATION_ROADMAP.md](./MIGRATION_ROADMAP.md) - Migration plan
- [README.md](./README.md) - Project README

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [MongoDB/Mongoose](https://mongoosejs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)

---

## FAQ

**Q: Why is the backend not being used?**
A: Frontend was built with Supabase first, backend was added later but never integrated.

**Q: Can I use both databases?**
A: Yes, but it's complex and creates technical debt. Better to consolidate.

**Q: Should I rebuild the backend or remove it?**
A: Rebuild it. Backend provides security, validation, and control. See MIGRATION_ROADMAP.

**Q: How long will migration take?**
A: 4-6 weeks if you have a team. 8-12 weeks if you're alone.

**Q: Can I keep the frontend as-is?**
A: Yes, you'll just update the API calls it makes.

**Q: What about real-time features?**
A: Can be handled with WebSockets on backend or keep Supabase for real-time.

---

## Support

For questions or clarifications:
1. Check the detailed architecture files
2. Review the migration roadmap
3. Look at code comments in models and routes
4. Check Supabase types for database schema

Last Updated: 2024-10-23
