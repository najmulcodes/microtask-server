# MicroTask Platform — Server

RESTful API backend for the MicroTask Platform. Handles authentication, task management, payments, and withdrawals.

🔗 **Live API:** https://microtask-server-cgj9.onrender.com

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web framework |
| MongoDB + Mongoose | Database & ODM |
| JWT | Authentication |
| Cloudinary | Image uploads |
| Stripe | Payment processing |
| Multer | File handling |
| bcryptjs | Password hashing |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Stripe account

### Installation

```bash
git clone https://github.com/najmulcodes/microtask-server
cd microtask-server
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=https://microtask-client-iota.vercel.app
```

### Run Locally

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Login with Google |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all available tasks |
| POST | `/api/tasks` | Create new task (Buyer) |
| PUT | `/api/tasks/:id` | Update task (Buyer) |
| DELETE | `/api/tasks/:id` | Delete task (Buyer) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions` | Submit task completion (Worker) |
| GET | `/api/submissions/my` | Get worker's submissions |
| GET | `/api/submissions/review` | Get submissions to review (Buyer) |
| PUT | `/api/submissions/:id/approve` | Approve submission (Buyer) |
| PUT | `/api/submissions/:id/reject` | Reject submission (Buyer) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create Stripe payment intent |
| POST | `/api/payments/confirm` | Confirm payment & add coins |

### Withdrawals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/withdrawals` | Request withdrawal (Worker) |
| GET | `/api/withdrawals` | Get all withdrawals (Admin) |
| PUT | `/api/withdrawals/:id/approve` | Approve withdrawal (Admin) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| DELETE | `/api/admin/users/:id` | Remove user |

---

## Project Structure

```
microtask-server/
├── config/
│   ├── db.js
│   └── cloudinary.js
├── middleware/
│   ├── auth.js
│   └── roleCheck.js
├── models/
│   ├── User.js
│   ├── Task.js
│   ├── Submission.js
│   ├── Payment.js
│   ├── Withdrawal.js
│   └── Notification.js
├── routes/
│   ├── auth.js
│   ├── tasks.js
│   ├── submissions.js
│   ├── payments.js
│   ├── withdrawals.js
│   └── admin.js
├── .env
├── server.js
└── package.json
```

---

## Deployment

Deployed on **Render** (free tier).

> ⚠️ Free tier spins down after inactivity — first request may take ~30 seconds to wake up.

### Required Render Environment Variables
Set all variables from the `.env` section above in Render → Environment.

---

## Coin System

| Action | Coins |
|--------|-------|
| Worker signup | +10 coins |
| Buyer signup | +50 coins |
| Task completion (approved) | +task reward |
| Minimum withdrawal | 200 coins ($10) |
| 1 USD purchase | 20 coins |

---

## Security

- Passwords hashed with **bcryptjs**
- JWT tokens expire in **7 days**
- Role-based middleware protects all sensitive routes
- CORS restricted to frontend origin only
- MongoDB Atlas IP whitelist configured
