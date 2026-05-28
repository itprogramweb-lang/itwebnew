# shared/types

TypeScript types และ interfaces ที่ใช้ร่วมกันระหว่าง frontend และ backend

**Round 41A:** Types ยังอยู่ที่ `src/types/` ตามเดิม
จะค่อย ๆ ย้ายมาที่นี่เมื่อพร้อม โดยมี re-export ที่ตำแหน่งเดิมเพื่อ backward compatibility

ตัวอย่าง types ที่จะย้ายมา:
- ComplaintStatus, ComplaintType
- UserRole
- SiteSettings shape
