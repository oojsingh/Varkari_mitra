# Migration Notes

## Session Expiry
- Sessions now expire after **7 days**.
- Auth checks use `WHERE token = $1 AND expires_at > NOW()` so expired sessions are rejected automatically.
- **No automatic cleanup job is implemented.** Expired rows remain in the `sessions` table until manually deleted. This is intentional to keep queries simple. If needed later, a periodic cleanup query such as `DELETE FROM sessions WHERE expires_at < NOW()` can be scheduled.

## Password Security
- Migrated from plaintext to **bcrypt-hashed** passwords.
- Schema column renamed from `password` to `password_hash`.
- Existing in-memory users with plaintext passwords will need to re-register; new registrations are hashed automatically.

## Tables Status
All in-memory stores have been converted to Postgres tables:
1. `users` — with `password_hash`
2. `sessions` — with `expires_at`
3. `devices`
4. `family`
5. `sevas`
6. `sanitation`
7. `lost_child`
8. `traffic` — with PostGIS `geometry(Point, 4326)`
9. `emergency`
10. `broadcast` — with PostGIS `geometry(Point, 4326)`
11. `palkhi_schedules` — seeded for 2024, 2025, 2026
