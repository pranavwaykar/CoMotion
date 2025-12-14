## CoMotion Sharing Platform (MERN + amCharts + Maps)

Rush-hour focused CoMotion sharing for verified employees. Backend is Node/Express + MongoDB (Mongoose) with JWT auth and RBAC. Frontend is React + TypeScript (Vite) with Mapbox maps and amCharts 5 for admin analytics.

### Stack
- Server: TypeScript, Express, Mongoose, JWT, Socket.io
- Client: React + Vite + TS, MUI, amCharts 5, react-map-gl (Mapbox)
- DB: MongoDB (Docker)

### Screenshots

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/4491b5ab-e739-4875-b9b1-375750cbbaa8" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/c198d41f-5752-48d6-adc8-20e82134b855" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/092c6978-dc41-4358-8fb1-caa6d7dbacfe" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/7cb538cf-22c9-4a34-bd7c-dfc9ecbdcc26" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/5b6d1b8a-3fc3-4db3-9a21-f7f4ad21831b" />

<img width="1440" height="900" alt="image" src="https://github.com/user-attachments/assets/a0082fe7-edc7-485d-b238-79a6a78357fc" />


### Quick Start (local)
1) Start MongoDB
```bash
docker compose up -d mongodb
```
2) Configure env files
- Create `server/.env` from `server/env.example` and set `JWT_SECRET`, `MONGODB_URL`, `CORS_ORIGIN`, and optionally `ORG_EMAIL_DOMAIN`.
- Create `client/.env` from `client/env.example` and set `VITE_API_URL` and a `VITE_MAPBOX_TOKEN`.

3) Install and run
```bash
# server
cd server
npm install
npm run dev

# client (in another terminal)
cd ../client
npm install
npm run dev
```

Server runs at `http://localhost:4000`, client at `http://localhost:5173`.

### Auth & Roles
- Register with company email. First user per email domain becomes org admin (auto-approved).
- Other users are created as `pending` and need admin approval.
- Admin endpoints under `/api/admin/*`.

### Key Endpoints
- `POST /api/auth/register { fullName, email, password }`
- `POST /api/auth/login { email, password }`
- `GET /api/auth/me`
- `GET /api/admin/users/pending` (admin)
- `POST /api/admin/approve/:userId` (admin)
- `POST /api/rides/offers`
- `POST /api/rides/requests`
- `POST /api/rides/match`
- `POST /api/rides/join`

### Notes
- Rush-hour windows enforced: morning 07–11, evening 16–21.
- Basic matching: time-window overlap + proximity to from/to within 3km.
- Socket.io emits: `ride:offer:new`, `ride:request:new`, `ride:match`, `admin:userApproved`.
- Admin dashboard charts powered by amCharts 5.

### Roadmap
- Live location sharing for ongoing trips
- Better routing (polyline) and detour estimation
- Org SSO/SAML and SCIM support
- Ride cancellations and dispute flows
- Export/Reporting


