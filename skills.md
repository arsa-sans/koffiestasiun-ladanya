# PROJECT MISSION

Saya ingin menyelesaikan project ini sesuai instruksi saya dan setiap perubahan harus mempertahankan stabilitas aplikasi. Jangan mengubah fitur yang sudah berjalan tanpa alasan yang jelas.

Project stack:
- Framework: Next.js v16 (App Router)
- Language: TypeScript
- ORM: Drizzle ORM
- Database: Supabase PostgreSQL
- Package Manager: Bun
- Authentication: Session + Role Based Access
- Target platform:
  - Web
  - Android wrapper (PWA / Capacitor)
- UI harus premium, modern, clean, responsive, dan tidak terlihat seperti template AI.

PRIORITAS UTAMA:
1. Tidak boleh merusak fitur existing
2. Tidak boleh membuat duplicate logic
3. Tidak boleh hardcode
4. Wajib reusable component
5. Wajib type-safe
6. Wajib responsive
7. Tidak boleh ada error build
8. Tidak boleh ada warning TypeScript
9. Tidak boleh ada error hydration
10. Semua perubahan harus production ready

========================================================
ROLE BASED DASHBOARD SYSTEM
========================================================

Pisahkan dashboard berdasarkan role login:

ROLE:
- ADMIN
- CASHIER
- KITCHEN

Aturan:

Jika login sebagai CASHIER:
- hanya boleh melihat dashboard kasir
- tidak boleh melihat dashboard admin
- tidak boleh melihat dashboard dapur

Jika login sebagai KITCHEN:
- hanya boleh melihat dashboard dapur
- tidak boleh melihat dashboard lain

Jika login sebagai ADMIN:
- dapat mengakses semua halaman admin

Tambahkan middleware protection:

- jika user mencoba akses halaman melalui URL manual:
   /admin
   /cashier
   /kitchen

maka:

cek session

jika belum login:
redirect ke login

jika role tidak sesuai:
redirect unauthorized

Gunakan:
- Next middleware
- server side validation
- protected route
- role guard

========================================================
LOGIN EXPERIENCE
========================================================

Jika user sudah login pada device:

- simpan session
- gunakan persistent auth
- jangan meminta login ulang

Karena project akan dijadikan aplikasi Android.

Gunakan:

- secure cookie
- refresh token
- session persistence
- remember login

Tetapi:

Jika token expired:
refresh otomatis

Jika session invalid:
logout paksa

========================================================
HALAMAN KASIR
========================================================

Buat fitur:

1.

Kasir dapat input pesanan customer

Flow:

Pilih:
- meja
- customer
- menu
- quantity
- modifier
- catatan

Lalu:

create order

Status:
- pending
- diproses
- selesai
- dibayar

2.

Kasir dapat melihat resep menu

Tujuan:

kasir mengetahui:

- bahan tersedia
- stok menipis
- stok habis

Saat membuka detail menu tampilkan:

Product
└ Recipe Composition
   └ Ingredient
      └ Stock
      └ Unit
      └ Remaining

Berikan indikator:

Hijau:
aman

Kuning:
stok menipis

Merah:
stok hampir habis

3.

CRUD meja

table:

restaurant_tables

Field:

- id
- number
- capacity
- status

Status:

- tersedia
- dipakai
- reservasi

Kasir dapat:

Create
Read
Update
Delete

4.

CRUD tambahan biaya

table:

additional_fees

Contoh:

- Pajak
- Service
- Biaya tambahan

Field:

- nama
- type
- nominal
- persen
- aktif

Sistem harus otomatis menghitung total.

========================================================
HALAMAN DAPUR
========================================================

Fitur:

1.

Dapur menerima order realtime dari kasir

Status:

pending
→ diproses
→ selesai

Gunakan realtime Supabase.

2.

Hitung durasi proses masak

Saat status berubah:

pending → diproses

simpan:

started_at

Saat selesai:

completed_at

Hitung:

duration_minutes

Tampilkan:

- waktu proses
- rata-rata waktu
- statistik performa dapur

========================================================
HALAMAN ADMIN
========================================================

Paling kompleks.

Admin harus bisa:

1.

Monitoring semua aktivitas aplikasi

Buat activity log:

- login
- logout
- create
- update
- delete
- transaksi
- perubahan stok
- perubahan pesanan

Field:

- user
- role
- activity
- page
- timestamp
- ip
- device

2.

Export semua data ke Excel

Semua data:

- transaksi
- user
- menu
- inventaris
- bahan
- aktivitas
- meja
- laporan

Gunakan:

xlsx

Export:
- per halaman
- seluruh data

3.

CRUD kategori menu

table:

categories

4.

CRUD bahan inventaris

table:

ingredients

Karena halaman inventaris sudah ada:

upgrade sistem agar terintegrasi.

Field:

- nama
- stok
- unit
- minimum_stock
- supplier

5.

CRUD Product/Menu

Saat membuat product:

Admin dapat meracik resep.

Relasi:

Product
→ Recipe
→ Ingredient

Contoh:

Matcha Latte

memerlukan:

- Matcha
- Susu
- Gula
- Es Batu

Admin dapat:

Tambah
Edit
Hapus

Ketika produk dibuat:

stok otomatis terbaca dari inventaris.

Kasir harus dapat melihat:

- tersedia
- stok menipis
- stok habis

Tambahkan modifier:

contoh:

Sugar:
- normal
- less
- no sugar

Ice:
- normal
- less
- no ice

Size:
- small
- medium
- large

Relasi:

Product
→ Modifier Group
→ Modifier Option

========================================================
UI / UX RULES
========================================================

Hapus:

- alert browser bawaan
- confirm bawaan
- popup bawaan

Ganti seluruhnya dengan:

Toast system modern

Gunakan:

- jquery toast style
atau
- Sonner
atau
- custom premium toast

Untuk:

- delete confirmation
- warning
- success
- failed
- info

Harus smooth animation.

========================================================
ICON RULE
========================================================

Semua icon wajib:

elegan
premium
minimal

Jangan terlihat seperti template AI.

Gunakan:

Lucide atau Tabler

Konsisten:

- ukuran
- stroke
- spacing

========================================================
RESPONSIVE RULE
========================================================

Cek seluruh layout:

Desktop
Laptop
Tablet
Mobile

Pastikan:

- tidak overflow
- tidak terpotong
- tidak bertumpuk
- tidak keluar layar
- sidebar aman
- table responsive
- modal responsive
- navbar responsive

Gunakan:

responsive testing checklist.

========================================================
QUALITY CONTROL
========================================================

Sebelum menyelesaikan task:

Lakukan audit:

1. TypeScript
2. Drizzle schema
3. Supabase relation
4. middleware
5. auth
6. role access
7. responsiveness
8. loading state
9. error handling
10. empty state

Wajib:

- tidak ada build error
- tidak ada console error
- tidak ada hydration mismatch
- tidak ada runtime error

Jika menemukan bug:

perbaiki dulu

baru lanjut task berikutnya

Jangan menyatakan task selesai jika masih ada error.

Selalu bertindak seperti senior fullstack engineer dan system architect.

========================================================
MIDDLEWARE PROTECTION
========================================================

Wajib buat middleware.ts di root project.

Proteksi rute:

/admin/* → hanya role admin
/cashier/* → hanya role cashier
/kitchen/* → hanya role kitchen

Jika belum login:
redirect ke /login

Jika role tidak sesuai:
redirect ke /unauthorized

Flow middleware:

1. Ambil session dari Supabase (cookie)
2. Jika tidak ada session → redirect /login
3. Jika ada session → query role dari tabel users
4. Jika role tidak cocok dengan path → redirect /unauthorized
5. Jika cocok → lanjutkan request

Gunakan:

- @supabase/ssr createServerClient
- next/server NextResponse
- cookie-based session

Jangan gunakan:
- JWT manual
- localStorage

========================================================
SUPABASE REALTIME
========================================================

Kitchen Display WAJIB menggunakan Supabase Realtime.

Jangan gunakan:
- polling
- setInterval
- manual refresh

Gunakan:
- supabase.channel()
- .on('postgres_changes', ...)
- subscribe ke tabel order_items

Event yang di-listen:

INSERT: order baru masuk
UPDATE: status berubah (pending → cooking → ready)

Saat event diterima:
- update state lokal
- tampilkan animasi masuk/keluar
- play notifikasi sound (opsional)

Cleanup:
- unsubscribe saat komponen unmount
- handle reconnect otomatis

========================================================
PWA / ANDROID WRAPPER
========================================================

Karena project akan dijadikan aplikasi Android:

Fase 1 — PWA:

1. Buat manifest.json:
   - name: Koffie Station POS
   - short_name: KoffieStation
   - display: standalone
   - orientation: portrait
   - theme_color: #C08B5C
   - background_color: #F8F5F2
   - icons: berbagai ukuran

2. Service Worker:
   - cache static assets
   - offline fallback page
   - workbox strategy

3. Meta tags di layout.tsx:
   - apple-mobile-web-app-capable
   - apple-mobile-web-app-status-bar-style
   - viewport

Fase 2 — Capacitor (opsional):
- wrap PWA dengan Capacitor
- native splash screen
- push notification
- camera access (untuk scan barcode)

========================================================
RESPONSIVE MOBILE DESIGN
========================================================

Karena target platform adalah Android:

Sidebar:
- Desktop: sidebar fixed 64px width
- Tablet: sidebar collapsible (icon only)
- Mobile: hamburger menu atau bottom navigation

Bottom Navigation (mobile):
- Tampilkan di mobile saja
- Max 4-5 item
- Kasir: Kasir, Riwayat
- Kitchen: Display
- Admin: Overview, Produk, Inventaris, Laporan, More

Breakpoint:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

Pastikan:
- touch-friendly (min 44px tap target)
- no horizontal scroll
- tabel di mobile pakai card view
- modal full-screen di mobile
- font size readable (min 14px body)

========================================================
INVENTORY DEDUCTION FLOW
========================================================

Saat order item berubah status ke "cooking":

1. Baca resep produk
2. Untuk setiap ingredient di resep:
   - Hitung quantity × order_item quantity
   - Kurangi stok ingredient
   - Catat di inventory_transactions (type: sale)
3. Set inventoryDeducted = true pada order_item
4. Jika stok ingredient < minStock:
   - Log warning
   - Update availability produk terkait

Saat void/cancel:
- Kembalikan stok ingredient
- Catat di inventory_transactions (type: adjustment)
- Set inventoryDeducted = false

========================================================
VOID / CANCEL ORDER
========================================================

Void Order:
- Admin atau kasir dapat void order
- Wajib isi alasan void
- Catat di void_logs
- Kembalikan stok inventory (jika sudah deducted)
- Update status order → void
- Update status semua item → void

Cancel Item:
- Kasir dapat cancel item individual
- Jika item belum di-proses (pending/queued): langsung cancel
- Jika item sudah cooking: perlu approval admin
- Catat di void_logs
- Kembalikan stok jika sudah deducted

========================================================
PRINT RECEIPT
========================================================

Kasir dapat print struk/receipt setelah pembayaran.

Gunakan:
- react-to-print (sudah terinstall)

Format receipt:
- Header: nama toko, alamat, nomor telepon
- Info order: nomor order, tanggal, kasir, meja
- Daftar item: nama, qty, harga, modifier
- Subtotal
- Biaya tambahan (tax, service)
- Total
- Metode pembayaran
- Footer: terima kasih, website

Tampilan:
- A4 atau thermal printer 80mm
- Font monospace untuk alignment

========================================================
DATABASE ARCHITECTURE REFERENCE
========================================================

Schema files (src/db/schema/):

auth.ts:
  - users (id, authId, name, email, role, avatarUrl, isActive)
  - userRoleEnum: admin, cashier, kitchen

restaurant.ts:
  - diningTables (id, code, name, capacity, status, isActive)
  - kitchenStations (id, name, type, description, isActive)
  - tableStatusEnum: available, occupied, reserved, cleaning
  - stationTypeEnum: bar, kitchen, sushi

products.ts:
  - categories (id, name, slug, description, imageUrl, sortOrder, isActive)
  - products (id, categoryId, stationId, name, description, price, imageUrl, isAvailable, sortOrder)
  - ingredients (id, name, unit, stock, minStock, costPerUnit, isActive)
  - recipes (id, productId, ingredientId, quantity)

modifiers.ts:
  - modifierGroups (id, name, description, isRequired, isMultiple, minSelect, maxSelect, sortOrder, isActive)
  - modifierOptions (id, groupId, name, price, sortOrder, isActive)
  - modifierRecipes (id, modifierOptionId, ingredientId, quantity)
  - productModifierGroups (id, productId, modifierGroupId, sortOrder)

orders.ts:
  - orders (id, orderNumber, tableId, cashierId, customerName, orderType, status, subtotal, taxAmount, serviceAmount, discountAmount, totalAmount, notes, paidAt)
  - orderItems (id, orderId, productId, quantity, unitPrice, totalPrice, status, notes, inventoryDeducted, startedAt, completedAt)
  - orderItemModifiers (id, orderItemId, modifierOptionId, name, price)
  - payments (id, orderId, method, amount, reference, note)
  - voidLogs (id, orderId, orderItemId, reason, voidedById)
  - orderStatusEnum: open, paid, void, canceled
  - itemStatusEnum: pending, queued, cooking, ready, delivered, canceled, void
  - paymentMethodEnum: cash, qris, card, ewallet, transfer
  - orderTypeEnum: dine_in, takeaway

inventory.ts:
  - inventoryTransactions (id, ingredientId, orderId, type, quantity, stockBefore, stockAfter, note, performedById)
  - stockOpnames (id, code, status, notes, performedById, confirmedAt)
  - stockOpnameItems (id, opnameId, ingredientId, systemStock, physicalStock, variance, note)
  - transactionTypeEnum: purchase, sale, adjustment, waste, opname
  - opnameStatusEnum: draft, confirmed

fees.ts:
  - additionalFees (id, name, type, value, isActive)
  - feeTypeEnum: percentage, fixed

activity-logs.ts:
  - activityLogs (id, userId, role, activity, entityType, entityId, description, metadata, page, ipAddress, userAgent)

========================================================
IMPLEMENTATION PROGRESS TRACKING
========================================================

[x] Project Setup (Next.js 16, Drizzle, Supabase, Bun)
[x] Database Schema (semua 9 schema files)
[x] Database Relations (relations.ts)
[x] Database Seed (seed.ts + seed-users.ts)
[x] Login Page (premium UI, Sonner toast, Framer Motion)
[x] Auth System (Supabase SSR, cookie-based)
[x] Role-based Redirect (root page)
[x] Unauthorized Page
[x] Sidebar Navigation (role-based, section grouping)
[x] Admin Overview Dashboard
[x] Admin — CRUD Produk
[x] Admin — CRUD Kategori
[x] Admin — CRUD Inventaris/Bahan
[x] Admin — CRUD Resep
[x] Admin — CRUD Modifier
[x] Admin — CRUD Meja
[x] Admin — CRUD Stasiun Dapur
[x] Admin — CRUD Biaya Tambahan
[x] Admin — CRUD Pengguna
[x] Admin — Activity Log
[x] Admin — Laporan (Recharts)
[x] Admin — Stock Opname
[x] Admin — Export Excel
[x] Kasir — Input Pesanan (pilih meja, menu, qty, modifier, catatan)
[x] Kasir — Cart Panel
[x] Kasir — Modifier Modal
[x] Kasir — Payment Modal
[x] Kasir — Resep Detail Modal (indikator stok)
[x] Kasir — Table Management Modal
[x] Kasir — Riwayat Order
[x] Dapur — Kitchen Display System
[ ] Middleware Route Protection
[ ] Supabase Realtime untuk Kitchen Display
[ ] Responsive Mobile (hamburger/bottom nav)
[ ] PWA Manifest + Service Worker
[ ] Session Monitoring (auto-logout, refresh)
[ ] Supplier field di ingredients
[ ] Dashboard Statistik Performa Dapur
[ ] Audit: semua delete pakai custom dialog
[ ] Audit: semua event ter-log di activity_logs
[ ] Audit: responsive semua halaman
[ ] Audit: loading state semua halaman
[ ] Audit: empty state semua halaman
[ ] Audit: build test (next build tanpa error)
[ ] Print Receipt (react-to-print)
[ ] Inventory deduction otomatis saat cooking
[ ] Void/Cancel order flow lengkap