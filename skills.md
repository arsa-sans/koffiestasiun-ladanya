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