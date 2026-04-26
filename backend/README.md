# Backend - Item Manager Lab Test

## Setup
1. Open a terminal inside the backend folder.
2. Run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`
4. Update `MONGO_URI` if needed.
5. Start the server:
   ```bash
   npm run dev
   ```

## Offline fallback
If MongoDB Atlas is unreachable, the API now starts in local JSON mode and uses `data/items.json`.
This lets you keep developing without changing networks.

## API Endpoints
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`
