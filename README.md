# Syrian Trade Connect Platform

A full-stack web application for connecting Syrian importers and exporters. This project features a modern React (Vite) frontend and a Node.js/Express backend with MongoDB Atlas for data storage. The platform supports multilingual (English/Arabic) user interfaces, user authentication, business profiles, and messaging between businesses.

---

## Features
- **User Authentication:** Register, login, JWT-based auth, password reset, and email verification.
- **Business Profiles:** (Planned) CRUD for business profiles, product listings, and verification.
- **Messaging:** (Planned) Real-time or asynchronous messaging between businesses.
- **Multilingual UI:** English and Arabic support with easy extensibility.
- **MongoDB Atlas:** Cloud database for scalable, secure data storage.
- **Modern Frontend:** Built with React, Vite, and Tailwind CSS for a fast, responsive UI.
- **API-Driven:** Frontend communicates with backend via RESTful API.

---

## Project Structure

```
syrian-trade-connect-platform/
├── backend/                # Node.js/Express backend API
│   ├── models/             # Mongoose models (User, Business, Message, Conversation)
│   ├── routes/             # Express route handlers (auth, business, messages, etc.)
│   ├── middleware/         # Auth and other middleware
│   ├── utils/              # Utility functions (email, etc.)
│   ├── server.js           # Main Express server entry point
│   └── ...
├── src/                    # React frontend source code
│   ├── pages/              # Main app pages (Login, Register, Browse, etc.)
│   ├── components/         # Reusable UI components
│   ├── contexts/           # Context providers (Language, Auth, etc.)
│   ├── data/               # Static or mock data (to be replaced by API)
│   └── ...
├── public/                 # Static assets for frontend
├── .env                    # Frontend environment variables (VITE_API_URL)
├── README.md               # This file
└── ...
```

---

## Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **MongoDB Atlas** account (free tier is fine)

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
# Email config (for production)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

### Frontend (`.env` in project root)
```
VITE_API_URL=http://localhost:5000
```

---

## Running Locally

### 1. **Clone the repository**
```bash
git clone https://github.com/yourusername/syrian-trade-connect-platform.git
cd syrian-trade-connect-platform
```

### 2. **Install dependencies**
```bash
cd backend && npm install
cd .. && npm install
```

### 3. **Set up environment variables**
- Copy `.env.example` to `.env` in both backend and root as needed, and fill in your values.

### 4. **Start the backend**
```bash
cd backend
npm run dev
```

### 5. **Start the frontend**
```bash
npm run dev
```
- Frontend runs on [http://localhost:8080](http://localhost:8080)
- Backend runs on [http://localhost:5000](http://localhost:5000)

---

## How It Works
- The **frontend** (React) sends API requests to the **backend** (Express) at `VITE_API_URL` (default: `http://localhost:5000`).
- The **backend** handles authentication, business logic, and data storage in **MongoDB Atlas**.
- User authentication uses JWT tokens, which are stored client-side and sent with API requests.
- The app supports both English and Arabic, with translations managed in React context.

---

## Deployment Tips
- Deploy the backend to Railway, Render, or similar Node.js hosting.
- Deploy the frontend to Vercel, Netlify, or similar static hosting.
- Use environment variables for production API URLs and secrets.
- Set up MongoDB Atlas IP whitelisting for your deployed backend.

---

## Roadmap
- [x] User authentication (register, login, JWT, password reset)
- [x] MongoDB Atlas integration
- [x] Multilingual UI (English/Arabic)
- [ ] Business profile CRUD
- [ ] Messaging system
- [ ] Product listings
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Deployment scripts

---

## License
MIT (or your preferred license)
