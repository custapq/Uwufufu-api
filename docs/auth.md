# Authentication

uwufufu's API lives at **`https://api.uwufufu.com/v1`** and authenticates with a
**Bearer token**.

## How it works

1. `POST /v1/auth/login` with `{ email, password }`.
2. On success the API issues an **access token**. In the browser it is stored in
   the `accessToken` cookie.
3. All authenticated requests send that token as a header:

   ```http
   Authorization: Bearer <accessToken>
   ```

   The browser also sends the cookie automatically (`credentials: include`), but
   the API authorizes off the `Authorization` header — a plain Bearer token works
   from any HTTP client, no cookie required.

## Endpoints

### `POST /v1/auth/login`

Request body:

```json
{ "email": "user@example.com", "password": "your-password" }
```

Validation (observed from the API's own error response):

- `email` — must be a valid email format.
- `password` — required, string, **8–50 characters**.

### `GET /v1/auth/me`

Returns the currently authenticated user. Requires `Authorization: Bearer`.

```json
{
  "id": 777086,
  "email": "<redacted>",
  "name": "custapq",
  "isVerified": true,
  "profileImage": null,
  "tier": "basic",
  "subscriptionEndDate": null,
  "isAdmin": false,
  "createdAt": "2026-06-05T18:14:24.180Z",
  "updatedAt": "2026-06-05T19:52:50.269Z"
}
```

Without a valid token this returns `401 Unauthorized`.

## Notes

- CORS is enabled (the site issues `OPTIONS` preflights), but a preflight `204`
  does **not** guarantee the route exists — confirm with the real method.
- Errors follow a consistent shape:
  `{ "message": string | string[], "error": string, "statusCode": number }`.
