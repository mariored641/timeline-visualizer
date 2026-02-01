# Timeline Visualizer - מדריך ייבוא מרובה
## ייבוא נתונים באמצעות AI

---

## 🚀 תהליך מהיר (3 שלבים):

1. **הורד את הקובץ הזה** (IMPORT_GUIDE.md)
2. **ערוך את הרשימה למטה** - הוסף את השמות שלך
3. **העלה לצ'אט AI** (Claude/ChatGPT) ואמור:
   > "צור לי לפי הקובץ המצורף קובץ נתונים"

**זהו!** תקבל קובץ JSON מוכן לייבוא. 🎉

---

## 📝 רשימת שמות לדוגמה (ערוך כאן):

### אנשים:
```
Ludwig van Beethoven
Friedrich Nietzsche
Immanuel Kant
Marie Curie
Albert Einstein
Virginia Woolf
Pablo Picasso
Johann Sebastian Bach
Leonardo da Vinci
```

### אירועים:
```
French Revolution
World War I
World War II
Industrial Revolution
Renaissance
Enlightenment
```

---

## 🤖 הפרומפט המלא:

```
אני משתמש באפליקציית Timeline Visualizer לויזואליזציה של אנשים ואירועים על ציר זמן.

אנא צור עבורי קובץ JSON עם המבנה הבא:

{
  "metadata": {
    "version": "1.0",
    "created_by": "AI Assistant Name",
    "created_at": "YYYY-MM-DD",
    "total_people": 0,
    "total_events": 0
  },
  "people": [
    {
      "id": "unique_id_lowercase",
      "name": "Full Name",
      "birth": YYYY,
      "death": YYYY or null,
      "categories": ["category1", "category2"],
      "primary_location": "country/region",
      "secondary_location": "country/region or null",
      "location_change_year": YYYY or null,
      "wikidata_id": "Q12345",
      "wikipedia_url": "full URL",
      "image_url": "full URL to image",
      "description": "תיאור קצר בעברית (1-2 משפטים)"
    }
  ],
  "events": [
    {
      "id": "unique_id_lowercase",
      "name": "Event Name",
      "start_year": YYYY,
      "end_year": YYYY or null,
      "category": "war/revolution/discovery/etc",
      "location": "country/region",
      "icon": "emoji",
      "wikidata_id": "Q12345",
      "wikipedia_url": "full URL",
      "description": "תיאור קצר בעברית (1-2 משפטים)"
    }
  ]
}

---

### קטגוריות נפוצות לאנשים:
- music, composer, pianist, conductor
- philosophy, philosopher
- science, physicist, chemist, biologist
- politics, politician, leader
- art, painter, sculptor
- literature, writer, poet

### קטגוריות נפוצות לאירועים:
- war (⚔️)
- revolution (🔥)
- discovery (🔬)
- art_movement (🎨)
- disaster (🌋)
- political (🏛️)
- economic (💰)

### מיקומים נפוצים:
- germany, france, italy, uk, austria, russia
- usa, china, japan, india
- europe, asia, americas

---

### כללים חשובים:
1. שנות מוות (death) - אם האדם עדיין חי, שים null
2. מיקום משני (secondary_location) - רק אם עבר מקום, אחרת null
3. id - צור מזהה ייחודי: שם_משפחה_שנת_לידה (באותיות קטנות באנגלית)
4. תיאור - **בעברית**, קצר ותמציתי
5. wikidata_id - חפש ב-Wikidata, אם לא מוצא שים null
6. categories - לפחות קטגוריה אחת, אפשר כמה

---

### הרשימה שלי:

**אנשים:**
[כאן תהיה הרשימה שהמשתמש ערך למעלה]

**אירועים:**
[כאן תהיה הרשימה שהמשתמש ערך למעלה]

---

אנא החזר רק את הקובץ JSON, ללא הסבר נוסף.
```

---

## 📦 דוגמת פלט:

```json
{
  "metadata": {
    "version": "1.0",
    "created_by": "Claude AI",
    "created_at": "2026-01-12",
    "total_people": 2,
    "total_events": 1
  },
  "people": [
    {
      "id": "beethoven_1770",
      "name": "Ludwig van Beethoven",
      "birth": 1770,
      "death": 1827,
      "categories": ["music", "composer"],
      "primary_location": "germany",
      "secondary_location": "austria",
      "location_change_year": 1792,
      "wikidata_id": "Q255",
      "wikipedia_url": "https://en.wikipedia.org/wiki/Ludwig_van_Beethoven",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg",
      "description": "מלחין ופסנתרן גרמני-אוסטרי, נחשב לאחד הגדולים בהיסטוריה המוזיקלית."
    }
  ],
  "events": [...]
}
```

---

## ⚙️ ייבוא לאפליקציה:

1. שמור את הקובץ שקיבלת
2. באפליקציה: **[📥 ייבוא קבוצתי]**
3. בחר את הקובץ
4. אשר
5. ✅ הכל בציר!

---

**בהצלחה!** 🎉
