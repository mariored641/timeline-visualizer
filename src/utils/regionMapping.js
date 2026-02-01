/**
 * מערכת מיפוי מיקומים לאזורים
 * ממירה מדינות וערים לאזורים גיאוגרפיים
 */

// ============================================
// מסד נתונים: מדינות → אזורים
// ============================================

export const COUNTRY_TO_REGION = {
  // ישראל
  "israel": "israel",
  "palestine": "israel",

  // בריטניה
  "united kingdom": "britain",
  "england": "britain",
  "scotland": "britain",
  "wales": "britain",
  "ireland": "britain",
  "northern ireland": "britain",

  // מערב אירופה
  "france": "western_europe",
  "germany": "western_europe",
  "austria": "western_europe",
  "switzerland": "western_europe",
  "belgium": "western_europe",
  "netherlands": "western_europe",
  "luxembourg": "western_europe",
  "denmark": "western_europe",
  "norway": "western_europe",
  "sweden": "western_europe",
  "finland": "western_europe",
  "iceland": "western_europe",

  // דרום אירופה
  "italy": "southern_europe",
  "spain": "southern_europe",
  "portugal": "southern_europe",
  "greece": "southern_europe",
  "croatia": "southern_europe",
  "slovenia": "southern_europe",
  "malta": "southern_europe",

  // מזרח אירופה
  "russia": "eastern_europe",
  "poland": "eastern_europe",
  "czech republic": "eastern_europe",
  "czechoslovakia": "eastern_europe",
  "hungary": "eastern_europe",
  "romania": "eastern_europe",
  "bulgaria": "eastern_europe",
  "ukraine": "eastern_europe",
  "belarus": "eastern_europe",
  "lithuania": "eastern_europe",
  "latvia": "eastern_europe",
  "estonia": "eastern_europe",
  "serbia": "eastern_europe",
  "bosnia": "eastern_europe",

  // צפון אמריקה
  "united states": "north_america",
  "usa": "north_america",
  "america": "north_america",
  "canada": "north_america",
  "mexico": "north_america",

  // דרום אמריקה
  "brazil": "south_america",
  "argentina": "south_america",
  "chile": "south_america",
  "peru": "south_america",
  "colombia": "south_america",
  "venezuela": "south_america",
  "ecuador": "south_america",
  "bolivia": "south_america",
  "uruguay": "south_america",
  "paraguay": "south_america",

  // אסיה
  "china": "asia",
  "japan": "asia",
  "india": "asia",
  "korea": "asia",
  "south korea": "asia",
  "north korea": "asia",
  "thailand": "asia",
  "vietnam": "asia",
  "indonesia": "asia",
  "philippines": "asia",
  "malaysia": "asia",
  "singapore": "asia",
  "pakistan": "asia",
  "bangladesh": "asia",
  "myanmar": "asia",
  "cambodia": "asia",
  "laos": "asia",
  "mongolia": "asia",
  "nepal": "asia",
  "sri lanka": "asia",

  // מזרח תיכון → אסיה
  "turkey": "asia",
  "ottoman empire": "asia",
  "iran": "asia",
  "persia": "asia",
  "iraq": "asia",
  "syria": "asia",
  "lebanon": "asia",
  "saudi arabia": "asia",
  "jordan": "asia",
  "yemen": "asia",
  "afghanistan": "asia",

  // אוקיאניה
  "australia": "oceania",
  "new zealand": "oceania",

  // אפריקה
  "egypt": "africa",
  "south africa": "africa",
  "kenya": "africa",
  "nigeria": "africa",
  "ethiopia": "africa",
  "morocco": "africa",
  "algeria": "africa",
  "tunisia": "africa",
  "libya": "africa",
  "ghana": "africa",
  "senegal": "africa",
  "tanzania": "africa",
  "uganda": "africa",
  "zimbabwe": "africa"
};

// ============================================
// מילון ערים מפורסמות → מדינה
// ============================================

export const CITY_TO_COUNTRY = {
  // ישראל
  "jerusalem": "israel",
  "tel aviv": "israel",
  "haifa": "israel",
  "beer sheva": "israel",

  // בריטניה
  "london": "england",
  "manchester": "england",
  "liverpool": "england",
  "edinburgh": "scotland",
  "glasgow": "scotland",
  "cardiff": "wales",
  "dublin": "ireland",
  "belfast": "northern ireland",
  "oxford": "england",
  "cambridge": "england",

  // מערב אירופה
  "paris": "france",
  "marseille": "france",
  "lyon": "france",
  "berlin": "germany",
  "munich": "germany",
  "hamburg": "germany",
  "cologne": "germany",
  "frankfurt": "germany",
  "vienna": "austria",
  "salzburg": "austria",
  "zurich": "switzerland",
  "geneva": "switzerland",
  "amsterdam": "netherlands",
  "rotterdam": "netherlands",
  "brussels": "belgium",
  "copenhagen": "denmark",
  "oslo": "norway",
  "stockholm": "sweden",
  "helsinki": "finland",

  // דרום אירופה
  "rome": "italy",
  "milan": "italy",
  "venice": "italy",
  "florence": "italy",
  "naples": "italy",
  "turin": "italy",
  "madrid": "spain",
  "barcelona": "spain",
  "seville": "spain",
  "valencia": "spain",
  "lisbon": "portugal",
  "porto": "portugal",
  "athens": "greece",

  // מזרח אירופה
  "moscow": "russia",
  "st petersburg": "russia",
  "saint petersburg": "russia",
  "warsaw": "poland",
  "krakow": "poland",
  "prague": "czech republic",
  "budapest": "hungary",
  "bucharest": "romania",
  "kiev": "ukraine",
  "kyiv": "ukraine",

  // צפון אמריקה
  "new york": "usa",
  "los angeles": "usa",
  "chicago": "usa",
  "boston": "usa",
  "san francisco": "usa",
  "washington": "usa",
  "philadelphia": "usa",
  "toronto": "canada",
  "montreal": "canada",
  "vancouver": "canada",
  "mexico city": "mexico",

  // דרום אמריקה
  "são paulo": "brazil",
  "sao paulo": "brazil",
  "rio de janeiro": "brazil",
  "buenos aires": "argentina",
  "santiago": "chile",
  "lima": "peru",
  "bogotá": "colombia",
  "bogota": "colombia",

  // אסיה
  "beijing": "china",
  "shanghai": "china",
  "hong kong": "china",
  "tokyo": "japan",
  "kyoto": "japan",
  "osaka": "japan",
  "delhi": "india",
  "mumbai": "india",
  "bangalore": "india",
  "seoul": "korea",
  "bangkok": "thailand",
  "singapore": "singapore",
  "istanbul": "turkey",
  "tehran": "iran",
  "baghdad": "iraq",

  // אוקיאניה
  "sydney": "australia",
  "melbourne": "australia",
  "brisbane": "australia",
  "auckland": "new zealand",

  // אפריקה
  "cairo": "egypt",
  "alexandria": "egypt",
  "johannesburg": "south africa",
  "cape town": "south africa",
  "nairobi": "kenya",
  "lagos": "nigeria"
};

// ============================================
// פונקציות זיהוי
// ============================================

/**
 * פונקציה ראשית: המרת מיקום לאזור
 * @param {string} wikidataLocation - מיקום מ-Wikidata (עיר או מדינה)
 * @returns {string|null} - קוד האזור או null אם לא נמצא
 */
export function getRegionFromLocation(wikidataLocation) {
  if (!wikidataLocation) return null;

  const location = wikidataLocation.toLowerCase().trim();

  // שלב 1: בדיקה ישירה במילון מדינות
  if (COUNTRY_TO_REGION[location]) {
    return COUNTRY_TO_REGION[location];
  }

  // שלב 2: בדיקה במילון ערים
  if (CITY_TO_COUNTRY[location]) {
    const country = CITY_TO_COUNTRY[location];
    return COUNTRY_TO_REGION[country] || null;
  }

  // שלב 3: חיפוש חלקי (substring matching)
  // מועיל למקרים כמו "Vienna, Austria" או "Paris, France"
  for (const [country, region] of Object.entries(COUNTRY_TO_REGION)) {
    if (location.includes(country)) {
      return region;
    }
  }

  // שלב 4: חיפוש בערים
  for (const [city, country] of Object.entries(CITY_TO_COUNTRY)) {
    if (location.includes(city)) {
      const region = COUNTRY_TO_REGION[country];
      if (region) return region;
    }
  }

  // לא נמצא - החזר null
  return null;
}

/**
 * אינטגרציה עם נתוני אדם - העשרה אוטומטית עם אזור
 * @param {object} person - אובייקט אדם עם birthPlace או citizenship
 * @returns {object} - אובייקט אדם מועשר עם primary_location
 */
export function enrichPersonWithRegion(person) {
  // אם יש מיקום לידה
  if (person.birthPlace) {
    const region = getRegionFromLocation(person.birthPlace);
    if (region) {
      return {
        ...person,
        primary_location: region,
        locationSource: 'birthPlace'
      };
    }
  }

  // אם יש אזרחות
  if (person.citizenship) {
    const region = getRegionFromLocation(person.citizenship);
    if (region) {
      return {
        ...person,
        primary_location: region,
        locationSource: 'citizenship'
      };
    }
  }

  // אם לא מצאנו - נשאיר null (המשתמש יצטרך לבחור ידנית)
  return {
    ...person,
    primary_location: null,
    locationSource: 'unknown'
  };
}

/**
 * קבלת רשימת כל האזורים הזמינים
 * @returns {Array} - מערך של אובייקטים עם id, name, icon
 */
export function getAvailableRegions() {
  return [
    { id: "israel", name: "ישראל", icon: "🇮🇱" },
    { id: "britain", name: "בריטניה", icon: "🇬🇧" },
    { id: "western_europe", name: "מערב אירופה", icon: "🇫🇷" },
    { id: "southern_europe", name: "דרום אירופה", icon: "🇮🇹" },
    { id: "eastern_europe", name: "מזרח אירופה", icon: "🇷🇺" },
    { id: "north_america", name: "צפון אמריקה", icon: "🇺🇸" },
    { id: "south_america", name: "דרום אמריקה", icon: "🇧🇷" },
    { id: "asia", name: "אסיה", icon: "🇨🇳" },
    { id: "oceania", name: "אוקיאניה", icon: "🇦🇺" },
    { id: "africa", name: "אפריקה", icon: "🇿🇦" }
  ];
}
