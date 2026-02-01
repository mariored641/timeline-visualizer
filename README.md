# Timeline Visualizer 🎯

אפליקציה אינטואיטיבית לויזואליזציה של אנשים ואירועים היסטוריים על ציר זמן אינטראקטיבי.

![Timeline Visualizer](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![D3.js](https://img.shields.io/badge/D3.js-7.9-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ תכונות עיקריות

- ✅ ציר זמן אינטראקטיבי עם זום וגלילה
- ✅ תצוגת אנשים ואירועים כקווים/פסים אופקיים
- ✅ קיבוץ אוטומטי לפי קטגוריות (מוזיקה, פילוסופיה, מדע, וכו')
- ✅ קידוד צבעוני לפי מיקום גיאוגרפי
- ✅ סינון מתקדם וניהול תצוגה
- ✅ השוואה בין דמויות עם קווים מקבילים אנכיים
- ✅ אינטגרציה אוטומטית עם Wikipedia/Wikidata
- ✅ ייבוא מרובה באמצעות קבצי JSON
- ✅ ייצוא לJSON

## 🚀 התחלה מהירה

### התקנה

```bash
# Clone the repository
git clone https://github.com/yourusername/timeline-visualizer.git
cd timeline-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

האפליקציה תרוץ על [http://localhost:5173](http://localhost:5173)

### Build לפרודקשן

```bash
npm run build
npm run preview
```

## 📖 שימוש

### הוספת פריטים

#### הוספה ידנית
1. לחץ על "הוסף חדש" בHeader
2. בחר "הוסף אדם" או "הוסף אירוע"
3. מלא את הפרטים
4. לחץ "הוסף"

#### ייבוא מ-Wikipedia
1. לחץ על "ייבוא" → "ייבוא מ-Wikipedia"
2. הדבק URL של דף ויקיפדיה
3. לחץ "שלוף נתונים"
4. אשר את הנתונים

#### ייבוא קבוצתי (JSON)
1. **קרא את המדריך**: [IMPORT_GUIDE_HE.md](./IMPORT_GUIDE_HE.md)
2. **בדוק את הדוגמה**: `example_import.json` בתיקיית הפרויקט
3. **צור קובץ JSON** עם הנתונים שלך (ראה מבנה למטה)
4. **ייבא**: לחץ "ייבוא" → "ייבוא קבוצתי (JSON)" → בחר קובץ

**טיפ:** השתמש ב-AI (Claude/ChatGPT) ליצירת JSON - העתק את המבנה מהמדריך!

#### בדיקת הייבוא
1. **נסה את הדוגמה**: ייבא את `example_import.json` כדי לוודא שהכל עובד
2. **בדוק שגיאות**: אם יש שגיאה, היא תוצג באדום עם פירוט
3. **כפילויות**: אם יש כפילויות (ID זהה), תקבל אפשרות לבחור:
   - דלג על כפילויות (שמור את הקיימים)
   - דרוס את הקיימים (החלף בחדשים)
4. **הצלחה**: הודעה בירוק תופיע והחלון ייסגר אוטומטית

### ניווט

- **זום**: גלגלת עכבר או כפתורי +/-
- **תזוזה**: כפתורי ◄/►
- **סינון**: Sidebar → סמן/בטל קטגוריות
- **פרטים**: לחיצה על פריט
- **תפריט הקשר**: לחיצה ארוכה על פריט

## 🛠️ טכנולוגיות

- **Frontend**: React 18, Vite
- **Visualization**: D3.js v7
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Data Source**: Wikipedia API, Wikidata

## 📂 מבנה הפרויקט

```
timeline-visualizer/
├── src/
│   ├── components/
│   │   ├── Timeline/         # רכיבי ציר הזמן
│   │   ├── Sidebar/          # פאנל סינון
│   │   ├── Modals/           # חלונות דיאלוג
│   │   └── UI/               # רכיבי UI כלליים
│   ├── services/             # שירותים (Wikidata, Layout)
│   ├── store/                # State management
│   ├── utils/                # פונקציות עזר
│   └── data/                 # נתונים ראשוניים
├── public/
│   └── IMPORT_GUIDE.md       # מדריך ייבוא
└── README.md
```

## 🎨 דוגמאות

### נתוני דוגמה

האפליקציה מגיעה עם נתוני דוגמה:
- Ludwig van Beethoven (1770-1827)
- Wolfgang Amadeus Mozart (1756-1791)
- Immanuel Kant (1724-1804)
- המהפכה הצרפתית (1789-1799)
- מלחמות נפוליאון (1803-1815)

### פורמט JSON לייבוא

```json
{
  "people": [
    {
      "id": "einstein_1879",
      "name": "Albert Einstein",
      "birth": 1879,
      "death": 1955,
      "categories": ["science", "physicist"],
      "primary_location": "germany",
      "wikidata_id": "Q937",
      "wikipedia_url": "https://en.wikipedia.org/wiki/Albert_Einstein",
      "description": "פיזיקאי תיאורטי, מפתח תורת היחסות"
    }
  ],
  "events": [...]
}
```

## 🤝 תרומה

תרומות מתקבלות בברכה! אנא:
1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/AmazingFeature`)
3. Commit השינויים (`git commit -m 'Add some AmazingFeature'`)
4. Push ל-branch (`git push origin feature/AmazingFeature`)
5. פתח Pull Request

## 📝 רישיון

MIT License - ראה קובץ LICENSE לפרטים

## 👨‍💻 מחבר

**Mario & Claude**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 תודות

- [D3.js](https://d3js.org/) - ספריית ויזואליזציה מדהימה
- [Wikidata](https://www.wikidata.org/) - מקור נתונים פתוח
- [Wikipedia](https://www.wikipedia.org/) - אנציקלופדיה חופשית

---

**נבנה עם ❤️ בעזרת Claude Code**
