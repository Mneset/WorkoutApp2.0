# WorkoutApp 2.0

A workout logging app for recording training sessions - exercises, sets, reps and weights. Users sign in with Auth0, and each user's logs are private to their account.

This version adds structured **workout plans**: you can build a plan out of reusable session templates, start it, and the app tracks which week you're on. Starting a session from a template pre-fills the exercises so you only have to fill in what you actually lifted.

## What you can do

- **Log a session** - record exercises, sets, reps, weight and notes, either freeform or from a template
- **Build workout plans** - a plan is a set of session templates (e.g. Push / Pull / Legs) with a day offset and a duration in weeks
- **Start a plan** - the app records your start date and tracks your current week
- **Resume an in-progress session** - sessions stay open until you end or cancel them
- **Review history** - browse past sessions and what you lifted

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19 (Create React App), React Router, Auth0 SPA SDK |
| Backend | Node.js + Express, Sequelize ORM, zod validation, JWT validated against Auth0 |
| Database | MySQL 8.0 |
| Serving | nginx (serves the built React app, proxies `/api` to the backend) |

The API lives under `/api/v1` and every route requires a valid Auth0 access token.

```
/api/v1/workout-plan       plans
/api/v1/session-template   reusable session definitions within a plan
/api/v1/exercise-template  exercises within a session template
/api/v1/session            session logs (start / end / cancel)
/api/v1/exercise-log       logged exercises within a session
/api/v1/sets               set types (normal, drop set, superset)
/api/v1/users              user profile and plan progress
```

## Auth0 setup

You need **two** things in your Auth0 tenant before the app will run.

**1. A Single Page Application** - gives you `REACT_APP_ACCESS_CLIENT_ID`. Add to its settings:

- Allowed Callback URLs: `http://localhost:3001, http://localhost`
- Allowed Logout URLs: same
- Allowed Web Origins: same

**2. An API** (Applications → APIs → Create API):

- Identifier: `http://localhost:3000/api/v1` - must match `AUTH_AUDIENCE` **exactly**
- Signing algorithm: RS256
- Under its Permissions tab, add the scope `start:session`

The identifier is just a string ID; Auth0 never calls it. If the audience doesn't match a registered API, Auth0 silently issues an encrypted opaque token instead of a JWT and the backend rejects it with `Invalid Compact JWS` - that error almost always means this step was missed.

## Running locally

You need Node.js 20+ and a local MySQL 8 instance.

### Backend

```bash
cd workoutLogger
npm install
npm run migrate     # create the schema
npm run seed        # roles, exercises, categories, equipment
npm start
```

Create `workoutLogger/.env` first:

```bash
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_NAME=workout_logger
DB_USERNAME=workout_user
DB_PASSWORD=yourpassword
DB_DIALECT=mysql
DB_UNDERSCORED=true
DB_TIMESTAMPS=false

AUTH_AUDIENCE=http://localhost:3000/api/v1
AUTH_ISSUER_BASE_URL=https://<your-tenant>.us.auth0.com/

CORS_ORIGIN=http://localhost:3001
```

Runs on `http://localhost:3000`.

Two things that will bite you if changed: `AUTH_ISSUER_BASE_URL` needs its **trailing slash** (the code concatenates `userinfo` onto it), and `DB_TIMESTAMPS` must stay `false` - no migration creates `created_at`/`updated_at` columns, so `true` produces a schema the seeders can't populate.

Note that **tables are not created automatically on startup.** The app previously called `sequelize.sync()`, which built the schema from the models and quietly drifted from the migrations. Migrations are now the single source of truth, so `npm run migrate` is a required step.

### Frontend

```bash
cd workoutLoggerFrontend
npm install
npm start
```

Create `workoutLoggerFrontend/.env` first:

```bash
PORT=3001
REACT_APP_ACCESS_DOMAIN=<your-tenant>.us.auth0.com
REACT_APP_ACCESS_CLIENT_ID=<your Auth0 SPA client id>
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
REACT_APP_API_AUDIENCE=http://localhost:3000/api/v1
```

Runs on `http://localhost:3001`. `PORT=3001` matters - CRA defaults to 3000, which collides with the backend, and `CORS_ORIGIN` expects 3001.

`REACT_APP_API_AUDIENCE` must match the backend's `AUTH_AUDIENCE` character for character. These values are inlined at build time, so restart the dev server after editing `.env`.

### Database scripts

```bash
npm run migrate       # apply migrations
npm run seed          # seed reference data
npm run migrate:undo  # roll back all migrations
npm run seed:undo     # remove seeded data
npm run db:reset      # undo -> migrate -> seed
```

### Tests

```bash
npm test
```

The suite runs against a real database - it builds its own schema with `sync({ force: true })` and seeds fixtures. Create it once:

```sql
CREATE DATABASE workout_logger_test;
GRANT ALL PRIVILEGES ON workout_logger_test.* TO 'workout_user'@'localhost';
```

Tests fetch a real Auth0 token via client credentials, so `workoutLogger/.env` also needs a machine-to-machine app:

```bash
AUTH0_TEST_CLIENT_ID=<m2m client id>
AUTH0_TEST_CLIENT_SECRET=<m2m client secret>
```

## Self-hosting on a Raspberry Pi (Docker + nginx)

The app is set up to run as a self-contained Docker stack so it can be self-hosted on a Raspberry Pi. **It has only been built and tested with Docker on a laptop so far - not yet deployed to the Pi.**

Three containers:

- **db** - MySQL 8.0 with a persistent volume and a healthcheck; the backend waits for it to be healthy
- **backend** - the Express API
- **nginx** - multi-stage build that compiles the React app and serves it, proxying `/api` to the backend

Everything is reachable on port 80 through nginx.

```bash
docker compose up -d --build
docker compose exec backend npm run migrate
docker compose exec backend npm run seed
```

Then open `http://localhost` (or `http://<pi-ip>`).

A root `.env` is required - see `.env.example` for the full list. It holds the DB credentials and the Auth0 values, and is gitignored.

### Pi-specific notes

**Build the images on the Pi itself** (`--build`) so they compile for ARM. Don't copy laptop-built images across. There are `.dockerignore` files at the root and in both app directories specifically to keep host `node_modules` - with x86 native binaries for `mysql2` - out of the build context.

**Use a 64-bit Pi OS.** The `mysql:8.0` image publishes `arm64` but not `armv7`, so a 32-bit OS won't find a usable image. If you hit an architecture problem there, swapping to `mariadb` in `docker-compose.yml` is the usual workaround - but that hasn't been tested here, so treat it as an untested change rather than a drop-in.

**Case-sensitive table names.** Linux MySQL/MariaDB is case-sensitive about table names where Windows MySQL isn't. Foreign key references in the models are all lowercase to match their `tableName` - if you add a model, keep that convention or you'll get `errno 150` on the Pi and nowhere else.

## Project layout

```
workoutLogger/            Express API
  ├── routes/             endpoint handlers
  ├── models/             Sequelize models
  ├── migrations/         schema (source of truth)
  ├── seeders/            reference data
  ├── schemas/            zod request validation
  ├── middleware/         validation middleware
  ├── utils/              response wrapper, error handler, user creation
  └── tests/              Jest + supertest integration tests

workoutLoggerFrontend/    React app
  └── src/
      ├── components/
      ├── context/        AuthContext, SessionContext
      └── api.js          axios instance

nginx/                    multi-stage build + reverse proxy config
docker-compose.yml        db + backend + nginx
```

## API response format

All responses share an envelope, but the payload key differs by outcome:

```jsonc
// success
{ "status": "success", "statuscode": 200, "data": { "result": ... } }

// error
{ "status": "error", "statuscode": 404, "data": { "message": "..." } }
```

Creation endpoints return **201**. Validation failures return **400** with `data.message` of `"Validation failed"` and a `data.errors` array naming the offending fields.
