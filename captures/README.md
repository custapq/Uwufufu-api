# captures/

ที่เก็บ network traffic ที่ดักจาก uwufufu.com สำหรับใช้ reverse-engineer API (Phase 1)

## วิธี export HAR จาก DevTools

1. เปิด uwufufu.com แล้ว **login** ให้เรียบร้อย
2. เปิด DevTools (`F12`) → แท็บ **Network**
3. ติ๊ก **Preserve log** และเลือก filter **Fetch/XHR**
4. ใช้งานเว็บตามฟีเจอร์ที่อยากแกะ (เปิดเกม, ค้นหา, เล่นรอบ, ดูผล ฯลฯ)
5. คลิกขวาในรายการ request → **Save all as HAR with content**
6. วางไฟล์ไว้ใน `captures/raw/` (เช่น `captures/raw/browse.har`, `captures/raw/play.har`)

## ⚠️ ความปลอดภัย

- HAR **มี cookie / auth token / ข้อมูลส่วนตัว** อยู่ → `captures/*.har` และ `captures/raw/` ถูก **gitignore ไว้แล้ว** จะไม่ถูก commit
- ตัวอย่าง request/response ที่ sanitize แล้ว (ลบ token ออก) จะถูกเก็บใน `captures/samples/` และ commit ได้

## โครงสร้าง

```
captures/
├── raw/        # HAR ดิบ (gitignored) — โยนไฟล์ที่ export มาไว้ตรงนี้
└── samples/    # request/response ที่ sanitize แล้ว (committed)
```
