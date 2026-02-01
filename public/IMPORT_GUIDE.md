# Timeline Visualizer - מדריך ייבוא נתונים
## הנחיות ליצירת JSON באמצעות AI

---

## תהליך מהיר:

1. **הורד/העתק את הקובץ הזה**
2. **ערוך את הרשימה למטה** - הוסף את השמות שלך
3. **העלה לצ'אט AI** (Claude/ChatGPT) ואמור:
   > "צור לי לפי הקובץ המצורף נתוני JSON"
4. **העתק את הטקסט שקיבלת** והדבק באפליקציה דרך: ייבוא → הדבק טקסט JSON

---

## רשימת שמות לעריכה:

### אנשים:
```
לודוויג ואן בטהובן
פרידריך ניטשה
עמנואל קאנט
מרי קירי
אלברט איינשטיין
```

### אירועים:
```
המהפכה הצרפתית
מלחמת העולם הראשונה
מלחמת העולם השנייה
```

---

## הנחיות מלאות ל-AI:

```
אני משתמש באפליקציית Timeline Visualizer לויזואליזציה של אנשים ואירועים על ציר זמן.

צור עבורי JSON עם המבנה המדויק הבא. חשוב מאוד: עקוב אחרי ההנחיות בקפידה כי האפליקציה מבצעת ולידציה על הנתונים.

=== מבנה הקובץ ===

{
  "people": [
    {
      "id": "string - מזהה ייחודי, פורמט: שם_משפחה_שנת_לידה באנגלית, לדוגמה: einstein_1879",
      "name": "string - שם מלא בעברית, לדוגמה: אלברט איינשטיין",
      "short_name": "string - שם מקוצר בעברית להצגה בזום רחוק. לרוב שם משפחה (איינשטיין, מוצרט, בן גוריון) או כינוי מקובל לרבנים וכדומה (הרמב״ם, הבעש״ט, המגיד)",
      "birth": "number - שנת לידה",
      "death": "number או null - שנת פטירה, null אם בחיים",
      "categories": ["מערך של קטגוריות - לפחות אחת"],
      "primary_location": "string - מיקום עיקרי",
      "secondary_location": "string או null - מיקום משני אם עבר מקום, אחרת null",
      "location_change_year": "number או null - שנת מעבר, אחרת null",
      "wikidata_id": "string או null - מזהה Wikidata (Q12345), null אם לא ידוע",
      "wikipedia_url": "string או null - קישור לוויקיפדיה",
      "image_url": "string או null - קישור לתמונה",
      "description": "string - תיאור קצר בעברית (1-2 משפטים)"
    }
  ],
  "events": [
    {
      "id": "string - מזהה ייחודי באנגלית, לדוגמה: french_revolution_1789",
      "name": "string - שם האירוע בעברית",
      "short_name": "string או null - שם מקוצר בעברית (אם השם ארוך)",
      "start_year": "number - שנת התחלה",
      "end_year": "number או null - שנת סיום, null לאירוע חד-פעמי",
      "category": "string - קטגוריה אחת",
      "location": "string - מיקום",
      "icon": "string - אמוג'י מתאים",
      "wikidata_id": "string או null",
      "wikipedia_url": "string או null",
      "description": "string - תיאור קצר בעברית"
    }
  ]
}

=== קטגוריות מותרות לאנשים (categories) ===
חובה להשתמש רק בערכים הבאים:
- music - מוזיקה (מלחינים, נגנים, זמרים)
- philosophy - פילוסופיה
- science - מדע (פיזיקה, כימיה, ביולוגיה, מתמטיקה)
- judaism - יהדות (רבנים, מקובלים, חסידות)
- religions - דתות אחרות (נצרות, אסלאם, בודהיזם)
- art - אמנות (ציור, פיסול, אדריכלות)
- politics - פוליטיקה (מנהיגים, מדינאים)

אפשר לשים כמה קטגוריות למערך, לדוגמה: ["judaism", "philosophy"]

=== מיקומים מותרים (primary_location / secondary_location / location) ===
חובה להשתמש רק בערכים הבאים:
- israel - ישראל / ארץ ישראל
- britain - בריטניה
- western_europe - מערב אירופה (צרפת, גרמניה, אוסטריה, שוויץ, הולנד, בלגיה)
- southern_europe - דרום אירופה (איטליה, ספרד, פורטוגל, יוון)
- eastern_europe - מזרח אירופה (רוסיה, פולין, אוקראינה, הונגריה, צ'כיה, רומניה, ליטא)
- north_america - צפון אמריקה (ארה"ב, קנדה)
- south_america - דרום אמריקה
- asia - אסיה (סין, יפן, הודו, מזרח תיכון, פרס)
- oceania - אוקיאניה (אוסטרליה, ניו זילנד)
- africa - אפריקה (מצרים, מרוקו, אתיופיה, דרום אפריקה)

=== כללים חשובים ===
1. name - תמיד בעברית
2. short_name - תמיד בעברית. לרוב שם משפחה (בטהובן, איינשטיין, טראמפ). לרבנים - השתמש בכינוי המקובל (הרמב״ם, הבעש״ט, רש״י). למנהיגים - השם המוכר (בן גוריון, צ'רצ'יל)
3. id - תמיד באנגלית באותיות קטנות עם קו תחתון
4. description - תמיד בעברית, 1-2 משפטים
5. categories - חובה לפחות אחת מהרשימה למעלה
6. primary_location - חובה, מהרשימה למעלה
7. death - לשים null אם האדם עדיין בחיים
8. secondary_location ו-location_change_year - לשים null אם לא רלוונטי

=== הרשימה שלי ===

**אנשים:**
[כאן תהיה הרשימה שהמשתמש ערך למעלה]

**אירועים:**
[כאן תהיה הרשימה שהמשתמש ערך למעלה]

=== פלט ===
החזר רק את ה-JSON, ללא הסבר נוסף. ודא שהוא JSON תקין.
```

---

## דוגמת פלט:

```json
{
  "people": [
    {
      "id": "beethoven_1770",
      "name": "לודוויג ואן בטהובן",
      "short_name": "בטהובן",
      "birth": 1770,
      "death": 1827,
      "categories": ["music"],
      "primary_location": "western_europe",
      "secondary_location": "western_europe",
      "location_change_year": 1792,
      "wikidata_id": "Q255",
      "wikipedia_url": "https://en.wikipedia.org/wiki/Ludwig_van_Beethoven",
      "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg",
      "description": "מלחין ופסנתרן גרמני-אוסטרי, נחשב לאחד הגדולים בהיסטוריה המוזיקלית."
    },
    {
      "id": "rambam_1138",
      "name": "הרמב״ם (משה בן מימון)",
      "short_name": "הרמב״ם",
      "birth": 1138,
      "death": 1204,
      "categories": ["judaism", "philosophy"],
      "primary_location": "southern_europe",
      "secondary_location": "africa",
      "location_change_year": 1165,
      "wikidata_id": "Q81178",
      "wikipedia_url": "https://en.wikipedia.org/wiki/Maimonides",
      "image_url": null,
      "description": "רופא, פילוסוף ופוסק הלכה. מחבר 'משנה תורה' ו'מורה נבוכים'."
    }
  ],
  "events": [
    {
      "id": "french_revolution_1789",
      "name": "המהפכה הצרפתית",
      "short_name": null,
      "start_year": 1789,
      "end_year": 1799,
      "category": "politics",
      "location": "western_europe",
      "icon": "🔥",
      "wikidata_id": "Q6534",
      "wikipedia_url": "https://en.wikipedia.org/wiki/French_Revolution",
      "description": "מהפכה פוליטית וחברתית רדיקלית בצרפת ששינתה את פני אירופה."
    }
  ]
}
```

---

## ייבוא לאפליקציה:

1. העתק את טקסט ה-JSON שקיבלת מה-AI
2. באפליקציה: לחץ **ייבוא** → **הדבק טקסט JSON**
3. הדבק את הטקסט בתיבה
4. לחץ **בדוק ואמת**
5. אשר את הייבוא

(אפשר גם לשמור כקובץ .json ולייבא דרך **ייבוא קבוצתי (JSON קובץ)**)
