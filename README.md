# 👑 খানবাড়ি ভাই ভাই রয়্যাল সমিতি
### Khanbari Bhai Bhai Royal Somity — Mobile-First MERN Stack Web App

---

## 📱 প্রজেক্ট পরিচিতি

একটি সম্পূর্ণ মোবাইল-ফার্স্ট সমিতি ম্যানেজমেন্ট অ্যাপ যা MERN Stack এবং Firebase দিয়ে তৈরি।

**প্রযুক্তি:** React 18 + Vite | Tailwind CSS 4 | DaisyUI | Firebase 11 | Node.js | Express | MongoDB

---

## ✨ ফিচার সমূহ

| ফিচার | বিবরণ |
|-------|-------|
| 🔐 **অথেনটিকেশন** | Firebase Email/Password + Google Login |
| 💳 **ওয়ালেট কার্ড** | গ্র্যাডিয়েন্ট ডিজিটাল কার্ড, ব্যালেন্স দেখা/লুকানো |
| 💬 **গ্রুপ চ্যাট** | Firebase Firestore-এর onSnapshot দিয়ে রিয়েল-টাইম |
| 🩸 **জরুরি তালিকা** | রক্তের গ্রুপ ফিল্টার + সরাসরি কল বাটন |
| 🎯 **লক্ষ্যমাত্রা** | প্রোগ্রেস বার সহ জমি/নির্মাণ লক্ষ্য ট্র্যাকার |
| 🖼️ **গ্যালারি** | ফটো গ্রিড + লাইটবক্স ভিউয়ার |
| 🔔 **নোটিফিকেশন** | অ্যাডমিন ব্রডকাস্ট + লাইভ ব্যাজ কাউন্ট |
| 👑 **অ্যাডমিন প্যানেল** | পেমেন্ট অনুমোদন, সদস্য ব্যবস্থাপনা, গ্যালারি আপলোড |

---

## 🗂️ প্রজেক্ট স্ট্রাকচার

```
khanbari-somity/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── BottomNav.jsx        # ৪-আইটেম বটম নেভিগেশন
│   │   │   ├── Navbar.jsx           # হেডার + অ্যাডমিন সাইডবার
│   │   │   └── Chat/
│   │   │       ├── ChatWindow.jsx   # Firebase onSnapshot চ্যাট
│   │   │       ├── ChatBubble.jsx   # মেসেজ বাবল UI
│   │   │       └── MessageInput.jsx # মেসেজ ইনপুট
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── Emergency.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminPayments.jsx
│   │   │   ├── AdminMembers.jsx
│   │   │   ├── AdminNotifications.jsx
│   │   │   └── AdminSettings.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useAxios.js
│   │   │   └── useNotifications.js
│   │   ├── providers/
│   │   │   ├── AuthProvider.jsx
│   │   │   └── QueryProvider.jsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   └── utils/
│   │       ├── api.js
│   │       ├── constants.js
│   │       └── firebase.js
│   └── index.html
│
├── server/                          # Express Backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── adminController.js
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Target.js
│   │   ├── Gallery.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── memberRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── adminMiddleware.js
│   │   └── upload.js
│   ├── config/
│   │   ├── db.js
│   │   └── firebase.js
│   ├── scripts/
│   │   └── seed.js
│   └── index.js
│
├── firestore.rules
├── storage.rules
├── firebase.json
└── .gitignore
```

---

## 🚀 ইনস্টলেশন ও সেটআপ

### ধাপ ১: Firebase সেটআপ

1. [Firebase Console](https://console.firebase.google.com) এ যান
2. নতুন প্রজেক্ট তৈরি করুন
3. নিচের সার্ভিসগুলো চালু করুন:
   - **Authentication** → Email/Password এবং Google provider চালু করুন
   - **Firestore Database** → Production mode-এ তৈরি করুন
   - **Storage** → চালু করুন
4. **Project Settings → Your Apps → Add Web App** → config কপি করুন
5. **Project Settings → Service Accounts → Generate New Private Key** → JSON ডাউনলোড করুন

### ধাপ ২: Cloudinary সেটআপ

1. [Cloudinary](https://cloudinary.com) এ বিনামূল্যে অ্যাকাউন্ট খুলুন
2. Dashboard থেকে `Cloud Name`, `API Key`, `API Secret` কপি করুন

### ধাপ ৩: এনভায়রনমেন্ট ভেরিয়েবল

**`client/.env`** (`.env.example` থেকে কপি করুন):
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5000/api
```

**`server/.env`** (`.env.example` থেকে কপি করুন):
```env
MONGODB_URI=mongodb+srv://...
PORT=5000
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### ধাপ ৪: Firestore Security Rules ডিপ্লয়

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

### ধাপ ৫: ডিপেন্ডেন্সি ইনস্টল ও রান

```bash
# সব ইনস্টল করুন
cd client && npm install
cd ../server && npm install

# ডেভেলপমেন্ট ডেটা লোড করুন (ঐচ্ছিক)
cd server && npm run seed

# দুটো আলাদা টার্মিনালে চালান:
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

অ্যাপ চলবে: **http://localhost:5173**

---

## 🔑 প্রথম অ্যাডমিন তৈরি

1. অ্যাপে গিয়ে Signup করুন (প্রথম সদস্য স্বয়ংক্রিয়ভাবে admin হবেন)
2. অথবা MongoDB Compass দিয়ে ম্যানুয়ালি `role: "admin"` সেট করুন:
   ```js
   db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
   ```

---

## 📡 API এন্ডপয়েন্ট

### Auth
| Method | Route | বিবরণ |
|--------|-------|-------|
| POST | `/api/auth/register` | নতুন সদস্য নিবন্ধন |
| GET | `/api/auth/me` | বর্তমান সদস্য তথ্য |
| POST | `/api/auth/sync` | Firebase লগইন সিঙ্ক |

### Member (লগইন প্রয়োজন)
| Method | Route | বিবরণ |
|--------|-------|-------|
| GET | `/api/member/transactions` | নিজের লেনদেন |
| POST | `/api/member/transactions/deposit` | জমার অনুরোধ |
| GET | `/api/member/targets` | লক্ষ্যমাত্রা তালিকা |
| GET | `/api/member/emergency-list` | জরুরি যোগাযোগ তালিকা |
| GET | `/api/member/gallery` | গ্যালারি ছবি |
| PATCH | `/api/member/profile` | প্রোফাইল আপডেট |
| GET | `/api/member/notifications` | নোটিফিকেশন ইনবক্স |

### Admin (অ্যাডমিন লগইন প্রয়োজন)
| Method | Route | বিবরণ |
|--------|-------|-------|
| GET | `/api/admin/stats` | ড্যাশবোর্ড পরিসংখ্যান |
| GET | `/api/admin/transactions` | সব লেনদেন |
| PATCH | `/api/admin/transactions/:id/approve` | অনুমোদন |
| PATCH | `/api/admin/transactions/:id/reject` | বাতিল |
| GET | `/api/admin/members` | সব সদস্য |
| PATCH | `/api/admin/members/:id/role` | ভূমিকা পরিবর্তন |
| POST | `/api/admin/targets` | লক্ষ্য তৈরি |
| POST | `/api/admin/gallery` | ছবি আপলোড |
| POST | `/api/admin/notifications` | নোটিফিকেশন পাঠান |

---

## 🌐 ডিপ্লয়মেন্ট

### Frontend → Firebase Hosting
```bash
cd client
npm run build
firebase deploy --only hosting
```

### Backend → Railway / Render
1. [Railway](https://railway.app) বা [Render](https://render.com) এ অ্যাকাউন্ট খুলুন
2. GitHub repo কানেক্ট করুন, `server/` ফোল্ডার রুট হিসেবে সেট করুন
3. সব `.env` ভেরিয়েবল সেট করুন
4. `CLIENT_URL` ফায়ারবেস হোস্টিং URL দিয়ে আপডেট করুন

---

## 📄 লাইসেন্স

MIT License — খানবাড়ি ভাই ভাই রয়্যাল সমিতি © ২০২৪
