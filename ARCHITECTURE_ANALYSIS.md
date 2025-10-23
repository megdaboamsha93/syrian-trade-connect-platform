# Syrian Trade Connect Platform - Current Backend Architecture

## Executive Summary
The platform has a **HYBRID architecture** with:
- **Custom Node.js/Express Backend** using MongoDB Atlas
- **Supabase PostgreSQL** for frontend features (auth, data storage)
- **Frontend** is a React/Vite app

This creates a **data duplication and integration mismatch** that needs to be addressed.

---

## 1. CURRENT BACKEND SETUP

### Backend Type: Custom Node.js/Express Backend
- **Framework**: Express.js 4.18.2
- **Language**: JavaScript (Node.js)
- **Port**: 5000 (default)
- **Database**: MongoDB Atlas (via Mongoose 8.0.3)
- **Authentication**: JWT-based (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3

### Server Configuration (backend/server.js)
```
- Helmet security headers
- CORS enabled for frontend
- Rate limiting (configurable window/max)
- Compression middleware
- Morgan logging
- Body parsing (10MB limit)
- Error handling middleware
- 404 handler
```

---

## 2. SERVICES/FEATURES CURRENTLY USING SUPABASE

### Supabase Integration (Frontend-side)
The frontend uses Supabase for:

1. **Authentication** (`src/contexts/AuthContext.tsx`)
   - Sign up with email verification
   - Sign in with password
   - Sign out
   - Session management
   - Auto token refresh

2. **File Upload/Storage** (`src/hooks/useFileUpload.ts`)
   - Business logos (bucket: `business-logos`)
   - Business covers (bucket: `business-covers`)
   - File validation and size limits
   - Public URL generation

3. **Real-time Notifications** (`src/hooks/useNotifications.ts`)
   - PostgreSQL changes subscription
   - Notification fetching
   - Mark as read functionality
   - Unread count tracking

4. **User Interests** (`src/components/InterestsManager.tsx`)
   - CRUD for user interests (categories, industries, business types)
   - Real-time updates

5. **Notification Preferences** (`src/components/NotificationPreferences.tsx`)
   - Email notification preferences
   - RFQ filter preferences

6. **Business Data** (via Supabase types)
   - Businesses table (with products, settings, views, reviews)
   - RFQ requests and responses
   - Logistics providers
   - Orders
   - Conversations and messages
   - Favorites

7. **Analytics**
   - Business views tracking
   - Product views/engagement
   - Daily view metrics

---

## 3. BACKEND FOLDER STRUCTURE

```
backend/
├── models/
│   ├── User.js         # User schema (email, password, preferences)
│   ├── Business.js     # Business schema (detailed)
│   ├── Message.js      # Message schema
│   └── Conversation.js # Conversation schema
├── routes/
│   └── auth.js         # Authentication endpoints (ONLY ROUTE IMPLEMENTED)
├── middleware/
│   └── auth.js         # JWT verification middleware
├── utils/
│   └── email.js        # Email utilities (dev stubs)
├── server.js           # Main Express server
├── package.json        # Dependencies
└── uploads/            # File upload directory
```

### Models Defined (Not API Routes Yet)
1. **User Model**
   - Fields: email, password, firstName, lastName, role, avatar, preferences
   - Methods: comparePassword, generateAuthToken, generateEmailVerificationToken
   - Relations: business (one-to-many)

2. **Business Model**
   - Fields: nameEn, nameAr, slug, description, businessType, industry
   - Sub-documents: products (nested schema), location, contactInfo, verification
   - Features: profileCompleteness virtual, incrementViews, updateRating methods
   - Relations: owner (User reference)

3. **Message Model**
   - Fields: content, messageType (text, inquiry, pricing_request, etc.)
   - Features: readBy tracking, editHistory, attachments
   - Relations: conversation, sender, senderBusiness

4. **Conversation Model**
   - Fields: participants (array), subject, lastMessage, status
   - Methods: addParticipant, removeParticipant, markAsRead, archive
   - Relations: participants, lastMessage

---

## 4. DATABASE SITUATION

### MongoDB Atlas (Backend)
**Currently Used For:**
- User accounts and authentication
- Business profiles (basic structure defined)
- Messages and conversations

**Status**: Models defined but not fully utilized (commented-out routes)

### Supabase PostgreSQL (Frontend)
**Currently Used For:**
- Authentication
- Business data
- RFQ system
- Logistics providers
- Orders
- Notifications
- User preferences and interests
- Analytics (views, engagement)

**Status**: Fully integrated into frontend

### Problem: Data Duplication
- User auth is in BOTH MongoDB (backend) and Supabase (frontend)
- Business data is in Supabase (used by frontend), not MongoDB
- Message/conversation data is modeled in MongoDB but not exposed via API

---

## 5. API ENDPOINTS THAT EXIST

### Currently Implemented Routes
All routes under `/api/auth/`:

**Auth Routes** (`backend/routes/auth.js`):
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login with credentials
GET    /api/auth/verify-email/:token   - Verify email
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/reset-password/:token - Reset password
GET    /api/auth/me                    - Get current user profile
PATCH  /api/auth/me                    - Update user profile
POST   /api/auth/change-password       - Change password
POST   /api/auth/deactivate            - Deactivate account
```

**Health Check Endpoint**:
```
GET    /api/health                     - Returns server status
```

### Commented Out Routes (Not Implemented)
- `/api/business/` - Business profile CRUD
- `/api/messages/` - Messaging system
- `/api/search/` - Search functionality
- `/api/upload/` - File upload handling

---

## 6. AUTHENTICATION SYSTEM

### DUAL Authentication Architecture (CONFLICT)

#### Backend Authentication (MongoDB + JWT)
1. **Registration** (`POST /api/auth/register`)
   - Email validation
   - Password hashing (bcryptjs, 12 rounds)
   - Stores in MongoDB User collection
   - Sends verification email (currently logged only)
   - Returns JWT token

2. **Login** (`POST /api/auth/login`)
   - Email + password validation
   - JWT token generation (expires in 7 days)
   - Updates lastLogin timestamp

3. **JWT Token Structure**
   ```javascript
   {
     userId: user._id,
     email: user.email,
     role: user.role
   }
   ```

4. **Middleware** (`backend/middleware/auth.js`)
   - `auth()` - Required authentication
   - `optionalAuth()` - Optional authentication
   - `requireBusinessOwner()` - Business owner check
   - `requireAdmin()` - Admin role check

5. **Password Requirements**
   - Minimum 12 characters
   - Must contain: uppercase, lowercase, number, special char (@$!%*?&)
   - Hashed with bcrypt before storage

6. **Email Verification**
   - Token generated (random bytes + crypto hash)
   - Token valid for 24 hours
   - Email sent (currently stubbed)

#### Frontend Authentication (Supabase)
1. Supabase Auth uses email/password
2. Auto-confirm disabled (email verification required)
3. Session persistence in localStorage
4. Auto token refresh
5. Used for all frontend data access

### THE CONFLICT
- **Backend**: JWT-based, MongoDB user storage
- **Frontend**: Supabase auth, PostgreSQL user storage
- **Frontend IGNORES backend auth** - It uses Supabase directly

---

## 7. TECHNOLOGY STACK

### Backend
```
Runtime: Node.js
Framework: Express.js 4.18.2
ORM: Mongoose 8.0.3
Database: MongoDB Atlas
Auth: JWT (jsonwebtoken 9.0.2)
Password: bcryptjs 2.4.3
File Upload: multer 2.0.0-rc.4
Validation: express-validator 7.0.1
Security: helmet 7.1.0, CORS, Rate limiting
Logging: morgan 1.10.0
Compression: compression 1.7.4
Utilities: dotenv, slugify, nodemailer (stubbed)
```

### Frontend
```
Framework: React 18.3.1
Build Tool: Vite 5.4.1
UI Components: shadcn/ui (Radix UI)
Database: Supabase (PostgreSQL)
Auth: Supabase Auth
File Storage: Supabase Storage
Styling: Tailwind CSS 3.4.11
Form Handling: react-hook-form 7.53.0
Validation: Zod 3.23.8
Routing: React Router 6.26.2
Query: React Query 5.56.2
Charting: Recharts 2.12.7
Maps: Leaflet 1.9.4
i18n: Manual context (English/Arabic)
```

---

## 8. KEY FINDINGS & ISSUES

### Critical Issues
1. **Architecture Mismatch**
   - Backend uses MongoDB + JWT
   - Frontend uses Supabase PostgreSQL
   - No integration between them

2. **Commented Out Routes**
   - Business routes not implemented
   - Message routes not implemented
   - Search routes not implemented
   - Upload routes not implemented

3. **Email Not Working**
   - Verification emails just logged to console
   - No nodemailer configuration in place
   - Email utility is development stub

4. **Data Duplication**
   - User accounts exist in BOTH MongoDB and Supabase
   - Business data only in Supabase (models defined in backend but not used)

5. **Frontend Ignores Backend**
   - Frontend directly accesses Supabase
   - Backend auth middleware not used by frontend
   - No backend API calls from frontend

### What's Working
- User authentication (in backend, not used by frontend)
- Basic middleware and error handling
- Security headers and rate limiting
- Password hashing and JWT generation
- Mongoose models (defined but not exposed)

### What Needs Implementation
- Business profile CRUD API
- Message/conversation APIs
- Search/filter APIs
- File upload APIs
- Admin dashboard APIs
- Email notification system (real smtp)

---

## 9. MIGRATION REQUIREMENTS

### To Consolidate Architecture, Need To:

**Option A: Make Backend the Source of Truth**
1. Implement all missing API routes (business, messages, search, upload)
2. Migrate Supabase data to MongoDB
3. Update frontend to call backend APIs instead of Supabase
4. Decommission Supabase (or use only for storage)

**Option B: Make Supabase the Source of Truth**
1. Delete MongoDB backend (or use it as cache/secondary)
2. Implement Supabase RLS (Row Level Security) policies
3. Keep frontend as-is (already using Supabase)
4. Frontend directly queries Supabase (no backend needed)

**Option C: Hybrid (Recommended)**
1. Keep backend as API layer
2. Implement missing routes using MongoDB
3. Sync critical data between MongoDB and Supabase
4. Frontend calls backend API (which handles Supabase sync)
5. Supabase storage only for files

---

## 10. ENVIRONMENT VARIABLES

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
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
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SMTP_HOST=smtp.gmail.com  (stubbed)
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app-password
SMTP_FROM=noreply@...
```

---

## File References

### Backend Files
- `/home/user/syrian-trade-connect-platform/backend/server.js` - Main server
- `/home/user/syrian-trade-connect-platform/backend/routes/auth.js` - Auth endpoints
- `/home/user/syrian-trade-connect-platform/backend/models/User.js` - User model
- `/home/user/syrian-trade-connect-platform/backend/models/Business.js` - Business model
- `/home/user/syrian-trade-connect-platform/backend/models/Message.js` - Message model
- `/home/user/syrian-trade-connect-platform/backend/models/Conversation.js` - Conversation model
- `/home/user/syrian-trade-connect-platform/backend/middleware/auth.js` - Auth middleware
- `/home/user/syrian-trade-connect-platform/backend/utils/email.js` - Email utils (stubbed)

### Frontend Files
- `/home/user/syrian-trade-connect-platform/src/contexts/AuthContext.tsx` - Auth context (Supabase)
- `/home/user/syrian-trade-connect-platform/src/integrations/supabase/client.ts` - Supabase client
- `/home/user/syrian-trade-connect-platform/src/integrations/supabase/types.ts` - Supabase types
- `/home/user/syrian-trade-connect-platform/src/hooks/useFileUpload.ts` - File upload hook
- `/home/user/syrian-trade-connect-platform/src/hooks/useNotifications.ts` - Notifications hook

