# LINE News Creation

## Feature Overview

Authorized admins can create news through the LINE OA without opening the dashboard. The admin sends a structured form, Gemini helps polish the text when available, the system sends a preview, and the admin must confirm before anything is published.

The dashboard remains the place for editing, removing, and advanced management.

## LINE Commands

- `สร้างข่าว`
- `จัดข่าว`
- `/news`
- `ยืนยันเผยแพร่`
- `ยกเลิกข่าว`
- `แก้ข่าว: <ข้อความ>`

## LINE Form

```text
 สร้างข่าวผ่าน LINE

กรอกข้อมูลตามฟอร์มด้านล่าง แล้วส่งกลับมาได้เลยครับ

จำเป็น: หัวข้อ, รายละเอียด
ไม่บังคับ: สรุปสั้น, รูปปก, หมายเหตุสำหรับ AI

หมวดหมู่ที่แนะนำ:
ประกาศ / รับสมัคร / กิจกรรม / ทุน / ความสำเร็จ

สถานะ:
เผยแพร่ / ฉบับร่าง

ข่าวเด่น:
ใช่ / ไม่

━━━━━━━━━━━━━━
สร้างข่าว
หัวข้อ:
หมวดหมู่:
วันที่เผยแพร่: ตอนนี้
สรุปสั้น:
รายละเอียด:
รูปปก: ใช้รูปที่แนบ / ไม่มีรูป
สถานะ: เผยแพร่
ข่าวเด่น: ไม่
หมายเหตุสำหรับ AI:
━━━━━━━━━━━━━━
```

## Field Meanings

- `หัวข้อ`: required.
- `รายละเอียด`: required.
- `สรุปสั้น`: optional; shown on the news list. If empty, Gemini can generate it.
- `หมวดหมู่`: optional; defaults to `ประกาศ`.
- `วันที่เผยแพร่`: optional; defaults to `ตอนนี้`.
- `รูปปก`: optional; the first LINE image can be used.
- `สถานะ`: defaults to `เผยแพร่`.
- `ข่าวเด่น`: defaults to `ไม่`.
- `หมายเหตุสำหรับ AI`: optional instruction for tone/style.

## Permission Requirements

- LINE user must be linked to a dashboard user.
- Linked dashboard user must have `manage_news`.
- Permission is checked before help/form handling, image handling, and publish confirmation.

## Required Environment Variables For Final Setup

- `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN`
- `LINE_MESSAGING_CHANNEL_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL_TEXT` optional
- `AI_NEWS_ENABLED=true`
- `AI_NEWS_DAILY_LIMIT_PER_USER=10`
- `NEXT_PUBLIC_SITE_URL`
- Existing Cloudinary env variables used by the project:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_FOLDER`
- Existing Supabase service env variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Supabase Migrations To Run Later

- `supabase/round43_line_news_drafts.sql`
- `supabase/round44_line_news_hardening.sql`

Run them only during the final setup round.

## LINE Developers Setup To Do Later

- Webhook URL: `https://it.rmutt.ac.th/api/line/webhook` or the current production domain.
- Use webhook: Enabled.
- Verify webhook after deploy.

## Gemini Quota Strategy

- Gemini is called only for valid authorized news forms.
- No Gemini call for help command.
- No Gemini call for unauthorized messages.
- No Gemini call when required fields are missing.
- No Gemini call on confirmation.
- Daily limit per user defaults to 10 through `AI_NEWS_DAILY_LIMIT_PER_USER`.
- If Gemini is unavailable or the daily limit is reached, the system returns a fallback preview from the submitted fields.

## Image Behavior

- LINE image content is downloaded server-side.
- The first image is used as the cover image.
- Cover image is uploaded to the existing Cloudinary `news` folder.
- No Gemini vision is used yet.
- No facts are extracted from images.
- Image-only drafts cannot publish until `หัวข้อ` and `รายละเอียด` are provided.

## QA Checklist

- Unauthorized user receives the link-account message.
- Linked user without permission receives the no-permission message.
- Authorized help command returns the LINE form.
- Text-only news creates a preview and can be confirmed.
- Image + text news publishes with `image_url`.
- `ยกเลิกข่าว` cancels the active draft.
- Duplicate confirm does not create duplicate news.
- Gemini disabled returns fallback preview.
- AI daily limit returns fallback preview.
- Existing complaint notification remains unchanged.
- Existing LINE account linking remains unchanged.
- Existing dashboard news remains unchanged.
- Existing public news remains unchanged.

## Rollback Notes

- Disable LINE webhook in LINE Developers.
- Set `AI_NEWS_ENABLED=false`.
- Remove or ignore Gemini env variables.
- Dashboard news remains available and unaffected.
