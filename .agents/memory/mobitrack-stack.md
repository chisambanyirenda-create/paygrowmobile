---
name: MobiTrack stack decisions
description: Key architectural decisions for the MobiTrack Zambian business app that all future work should respect
---

- **OpenAPI-first**: All API types come from `lib/api-spec/openapi.yaml` → Orval codegen → `lib/api-client-react`. Never hand-edit generated files in `lib/api-client-react/src/generated/`.
- **Currency**: ZMW (Zambian Kwacha). `formatZMW()` in `artifacts/mobile-biz/src/lib/utils.ts` handles negatives explicitly (prepends `-` to absolute value) to avoid locale split-rendering.
- **Sales are transactional**: POST /api/sales uses a dedicated pool client with BEGIN/COMMIT/ROLLBACK + `FOR UPDATE` row locks on products. Never bypass this with direct DB writes.
- **Dark mode always-on**: `class="dark"` on `<html>`. No toggle needed.
- **Design palette**: `#050C1B` deep space navy background, electric cyan primary, `#ffcc00` gold for profit, `#b470ff` violet for counts, `emerald-400` for customers/positive indicators, crimson/destructive for expenses/losses.
- **Settings persistence**: Business settings stored in `localStorage` under key `mobitrack_settings`. No backend settings endpoint.
- **Dashboard default period**: `week` (not `month`) — gives more data points with seeded data.
- **POS form**: quantity increment buttons must coerce to `Number()` before adding 1; payment method Select must use `value=` (controlled) not `defaultValue=`.

**Why:** These decisions were made to serve a Zambian solo entrepreneur managing a phone & accessories shop. Consistency is critical — changing any of these mid-project would break the visual language or data integrity.
