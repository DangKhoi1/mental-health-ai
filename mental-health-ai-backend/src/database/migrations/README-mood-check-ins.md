# Multiple mood check-ins

When `DB_SYNCHRONIZE=false`, apply `20261029-mood-recorded-at.sql` before deploying the backend. Development environments with schema synchronization enabled add the nullable column automatically.

Old entries keep their original `createdAt`; clients fall back to it when `recordedAt` is null. New entries receive `recordedAt` from the server. Editing changes `updatedAt`, not the original observation time. Backdated input is not enabled in this version.

Creation accepts an optional UUID `requestId`. Reuse the same UUID when retrying a request; generate a new UUID for a distinct observation. The UUID is the entry primary key, so concurrent retries cannot insert duplicates. Update DTOs exclude creation-only fields.

Within five minutes of the latest active entry, creation returns `EC: 2` with `data.recentMood` without writing. The UI offers edit, new observation, and cancel. To explicitly create another observation, resubmit with `confirmRecent: true`. There is no daily or per-session recording limit.

Calendar date filtering and daily summary grouping use Asia/Ho_Chi_Minh. Daily averages have equal weight in the multi-day summary. Recommendation snapshots include recent entry IDs, timestamps, scores and notes; cached dashboard recommendations are refreshed after mood mutations. This change does not send additional notifications.

Validation: `npm run build`; frontend: `npx tsc --noEmit --incremental false`.
