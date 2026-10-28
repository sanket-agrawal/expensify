# Tripsplit 🏖️

> Chill trip expense splitting for friend groups. Think *"Splitwise, but with a golden-hour beach holiday feel"*. Mobile-first, fast, and lightweight.

![Tripsplit Preview](https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Highlights

- **Instant Trip Creation:** Set up a trip in seconds with custom emoji, default currency, and 2–10 friends. Generates an unguessable 24-character access token URL (`/t/:token`).
- **"Who are you?" Identity Seam:** Device-level participant selector without forced sign-up, cleanly architected with an `AuthProvider` interface ready for Google Sign-In.
- **Smart Category Matcher:** As you type bill titles, client-side keyword & fuzzy matching instantly detects categories and pops in tinted Lucide icons across 17 holiday categories (covering Indian contexts: *chai, dhaba, thali, petrol, toll, fastag, auto, ola, uber, scooty, homestay, resort, tickets, scuba diving*).
- **Strict Integer Money Engine:** All calculations run on integer minor units (paise) with deterministic remainder distribution (+1 paise to first $N$ friends).
- **Greedy Settlement Minimization:** Pure creditor/debtor matching algorithm in `shared/settlement.ts` computes the absolute minimal transfers required to settle the group ($A \to B \to C$ simplifies to $A \to C$).
- **Direct-to-GCS Bill Uploads:** Upload receipt photos directly from the browser to Google Cloud Storage via V4 signed PUT URLs (bypassing Vercel's ~4.5MB serverless body limit) with client-side image compression ($< 1600\text{px}$, JPEG $\sim 0.8$) and fullscreen zoomable lightbox.
- **WhatsApp Summary & UPI Helper:** One-tap emoji summary generated for WhatsApp sharing, plus `upi://pay` deep links for rapid settlement.
- **Chill Holiday Aesthetic:** Sand `#FBF7F0`, card white `#FFFFFF`, lagoon teal `#1FA3A3`, deep sea `#0E5A6B`, coral `#FF7A59`, sunshine `#FFC857`, and "night at the beach" dark mode (`#0B1D26`). Self-hosted **Fraunces** display serif & **Plus Jakarta Sans** UI typography with tabular numerals.

---

## 🛠️ Technology Stack

- **Frontend:** Vue 3 (Composition API, `<script setup lang="ts">`), TypeScript strict mode, Vite, Vue Router, Pinia
- **Styling:** Tailwind CSS with custom holiday tokens, CSS variables, and safe-area insets
- **Icons:** `lucide-vue-next`
- **Backend:** Vercel Serverless Functions in `/api` (TypeScript), no separate server
- **Database:** MongoDB via native `mongodb` driver (cached on `globalThis._mongoCache` to prevent serverless connection exhaustion)
- **File Storage:** Google Cloud Storage private bucket with V4 signed PUT and short-lived GET URLs
- **Validation:** Shared Zod schemas in `/shared/schemas`
- **Testing:** Vitest (100% pass on split, settlement, money, and category matcher suites)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/sanket-agrawal/expensify.git
cd expensify
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB` | Database name | `tripsplit` |
| `GCS_BUCKET` | Private Google Cloud Storage bucket name | `tripsplit-receipts` |
| `GCP_SERVICE_ACCOUNT_JSON_BASE64` | Base64-encoded GCP Service Account JSON key | `ewogICJ0eXBl...` |

*(Note: In local standalone mode without live Mongo/GCS credentials, Tripsplit features an automatic local dev fallback that persists to `localStorage` so the entire UI and feature set can be tested out of the box).*

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

### 4. Run Test Suite & Type-Check

```bash
npm test            # Run Vitest test suite
npm run type-check  # Verify TypeScript strict mode (0 errors)
npm run build       # Build production bundle
```

---

## ☁️ Production Deployment on Vercel

### 1. Deploy Repository

1. Import the repository into your Vercel dashboard.
2. The framework preset is automatically detected as **Vite**.
3. Output Directory: `dist`.

### 2. Configure Vercel Environment Variables

In your Vercel Project Settings $\to$ **Environment Variables**, add:

- `MONGODB_URI`: Your MongoDB Atlas URI.
- `MONGODB_DB`: `tripsplit`
- `GCS_BUCKET`: Your private GCS bucket name.
- `GCP_SERVICE_ACCOUNT_JSON_BASE64`: Base64 string of your service account credentials.

### 3. Google Cloud Storage Setup

#### Step 1: Create a Private Bucket
```bash
gcloud storage buckets create gs://tripsplit-receipts \
  --location=asia-south1 \
  --uniform-bucket-level-access
```

#### Step 2: Configure Bucket CORS
Direct browser uploads require Cross-Origin Resource Sharing (CORS) on the bucket. Use the provided [gcs-cors.json](file:///d:/Projects/expensify/gcs-cors.json):

```bash
gcloud storage buckets update gs://tripsplit-receipts --cors-file=gcs-cors.json
```

Content of `gcs-cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["PUT", "GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

#### Step 3: Create Service Account & Assign IAM Role
Create a service account with permissions to generate signed URLs:

```bash
# Create service account
gcloud iam service-accounts create tripsplit-uploader \
  --description="Service account for Tripsplit signed URLs" \
  --display-name="Tripsplit Uploader"

# Assign Storage Object Admin role to the bucket
gcloud storage buckets add-iam-policy-binding gs://tripsplit-receipts \
  --member="serviceAccount:tripsplit-uploader@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Generate and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=tripsplit-uploader@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Base64 encode for Vercel env var
base64 -w 0 key.json  # on Linux
# or in PowerShell:
# [Convert]::ToBase64String([IO.File]::ReadAllBytes("key.json"))
```

---

## 📁 Project Architecture

```text
expensify/
├── api/                                 # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── auth.ts                      # getActor(req) - Auth seam
│   │   ├── db.ts                        # MongoDB client cached on globalThis
│   │   ├── errors.ts                    # Unified error response formatting
│   │   ├── gcs.ts                       # GCS V4 signed upload and photo URLs
│   │   └── handler.ts                   # createHandler wrapper & token validator
│   └── trips/
│       ├── index.ts                     # POST /api/trips
│       └── [token]/
│           ├── index.ts                 # GET /api/trips/[token]
│           ├── expenses/
│           │   ├── index.ts             # GET & POST /api/trips/[token]/expenses
│           │   └── [id].ts              # PATCH & DELETE (soft-delete)
│           ├── uploads/
│           │   └── sign.ts              # POST signed PUT URL
│           ├── photos/
│           │   └── sign.ts              # GET signed GET URL
│           └── settlements/
│               └── index.ts             # GET & POST settlements
│
├── shared/                              # Shared contract between Vue & API
│   ├── schemas/
│   │   ├── trip.ts                      # Trip & Participant Zod schemas
│   │   ├── expense.ts                   # Expense, Split & Category schemas
│   │   └── settlement.ts                # Settlement & Payment schemas
│   ├── money.ts                         # Minor units, parsing, and remainder math
│   ├── split.ts                         # Equal, Exact, Percentage split calculators
│   ├── settlement.ts                    # Greedy creditor-debtor minimizer
│   └── types.ts                         # Derived TypeScript types (z.infer)
│
├── src/
│   ├── auth/                            # AuthProvider interface & TokenPickerAuth
│   ├── components/
│   │   ├── ui/                          # Button, Card, IconChip, Avatar, MoneyText,
│   │   │                                # BottomSheet, Toast, EmptyState, Skeleton,
│   │   │                                # SegmentedControl, PhotoGrid, Lightbox
│   │   ├── layout/                      # AppHeader, BottomNav, HeroDivider
│   │   ├── trip/                        # ParticipantPickerModal, CategoryBreakdown
│   │   └── expense/                     # ExpenseRow, SplitSharesEditor
│   ├── pages/                           # HomePage, CreateTripPage, TripDashboardPage,
│   │                                    # ExpensesListPage, AddEditExpensePage,
│   │                                    # ExpenseDetailPage, SettleUpPage, NotFoundPage
│   ├── stores/                          # useTripStore, useExpenseStore
│   ├── lib/                             # categoryMatcher.ts, imageCompress.ts, apiClient.ts
│   ├── config/                          # app.ts (single config file for renaming)
│   └── styles/                          # tokens.css (holiday palette), main.css
│
├── tests/                               # Vitest unit & integration test suites
├── gcs-cors.json                        # GCS CORS configuration file
├── vercel.json                          # SPA routing configuration
└── tailwind.config.ts                   # Custom design tokens & radii
```

---

## 🔒 Security & Performance

- **No Secrets in Repo:** All credentials loaded exclusively via environment variables.
- **Zero Proxy Image Traffic:** High-resolution photos are uploaded directly from user devices to GCS, saving serverless bandwidth and avoiding Vercel payload limits.
- **Type Safety Floor:** TypeScript strict mode with `noUncheckedIndexedAccess` and zero `any`.
- **Accessible (WCAG AA):** High-contrast color tokens in both light and dark modes, visible focus rings, ARIA roles, and `prefers-reduced-motion` compliance.

---

## 📄 License

MIT. Built with 🏖️ for chill trips and clean splits.
