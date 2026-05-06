# Color Memory Experiment

Replication of **Experiment 1** from Kuhbandner et al. (2015) — *Differential binding of colors to objects in memory*.

A web-based psychology experiment where participants memorize colored words and are later tested on word recall and color recall.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **Tailwind CSS** + **shadcn/ui**
- **Drizzle ORM** + **Neon Postgres** (serverless)
- **Framer Motion** for transitions
- **Recharts** for admin statistics
- **papaparse** (CSV) + **jspdf** (PDF) for data export

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Gnjurats/color-memory-experiment.git
cd color-memory-experiment
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
ADMIN_PASSWORD=your-admin-password
```

- **`DATABASE_URL`**: Your Neon Postgres connection string. On Vercel, attach a Neon database via the Vercel dashboard (Settings > Storage > Connect Database).
- **`ADMIN_PASSWORD`**: Password for the `/admin` panel. Can be plain text or bcrypt-hashed.

### 3. Database migration

Push the schema to your database:

```bash
npm run db:push
```

Or use migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed sequences

Generate the 50 pre-built experiment sequences:

```bash
npm run seed
```

### 5. Run locally

```bash
npm run dev
```

## Deployment on Vercel

1. Push to GitHub
2. Import the repo on Vercel
3. **Attach a Neon database** via Vercel dashboard (Settings > Storage). This auto-sets `DATABASE_URL`.
4. Add `ADMIN_PASSWORD` to Vercel environment variables
5. After first deploy, run the seed script locally with your production `DATABASE_URL`:
   ```bash
   DATABASE_URL=your-production-url npm run seed
   ```

## Experiment Flow

1. **Welcome** — consent + optional pseudo
2. **Memorization** — 48 colored words shown twice (4s each, 0.5s ISI)
3. **Distraction** — 4-minute math/trivia quiz
4. **Test** — For each word: type completion (4.5s), select color, rate confidence (1-4)
5. **Thank you**

## Admin Panel (`/admin`)

- Password-protected
- View all participants and their trials
- Toggle word correctness for manual review
- Aggregate statistics with charts
- Export data as CSV or PDF
