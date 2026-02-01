/**
 * Wikidata Service for fetching data from Wikidata/Wikipedia
 */

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php'
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'

class WikidataService {
  /**
   * Get Wikidata ID from Wikipedia URL
   */
  async getWikidataIdFromWikipediaUrl(wikipediaUrl) {
    try {
      const pageTitle = this.extractPageTitle(wikipediaUrl)
      if (!pageTitle) {
        throw new Error('Invalid Wikipedia URL')
      }

      const params = new URLSearchParams({
        action: 'query',
        prop: 'pageprops',
        titles: pageTitle,
        format: 'json',
        origin: '*'
      })

      const response = await fetch(`${WIKIPEDIA_API}?${params}`)
      const data = await response.json()

      const pages = data.query.pages
      const pageId = Object.keys(pages)[0]

      if (pageId === '-1') {
        throw new Error('Page not found')
      }

      const wikidataId = pages[pageId].pageprops?.wikibase_item

      if (!wikidataId) {
        throw new Error('No Wikidata ID found')
      }

      return wikidataId
    } catch (error) {
      console.error('Error fetching Wikidata ID:', error)
      throw error
    }
  }

  /**
   * Fetch entity data from Wikidata
   */
  async fetchEntityData(wikidataId) {
    try {
      const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
      const response = await fetch(url)
      const data = await response.json()

      const entity = data.entities[wikidataId]

      if (!entity) {
        throw new Error('Entity not found')
      }

      return {
        name: this.extractLabel(entity),
        birth: this.extractBirthDate(entity),
        death: this.extractDeathDate(entity),
        occupations: this.extractOccupations(entity),
        birthPlace: await this.extractBirthPlace(entity),
        citizenship: await this.extractCitizenship(entity),
        image: await this.extractImage(entity),
        description: this.extractDescription(entity)
      }
    } catch (error) {
      console.error('Error fetching entity data:', error)
      throw error
    }
  }

  /**
   * Extract page title from URL
   */
  extractPageTitle(wikipediaUrl) {
    const match = wikipediaUrl.match(/\/wiki\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  }

  /**
   * Extract label (name)
   */
  extractLabel(entity) {
    return entity.labels?.en?.value || entity.labels?.he?.value || 'Unknown'
  }

  /**
   * Extract birth date
   */
  extractBirthDate(entity) {
    const birthClaim = entity.claims?.P569 // date of birth
    if (!birthClaim || birthClaim.length === 0) return null

    const timeValue = birthClaim[0].mainsnak?.datavalue?.value?.time
    if (!timeValue) return null

    const match = timeValue.match(/^[+-]?(\d+)-/)
    return match ? parseInt(match[1]) : null
  }

  /**
   * Extract death date
   */
  extractDeathDate(entity) {
    const deathClaim = entity.claims?.P570 // date of death
    if (!deathClaim || deathClaim.length === 0) return null

    const timeValue = deathClaim[0].mainsnak?.datavalue?.value?.time
    if (!timeValue) return null

    const match = timeValue.match(/^[+-]?(\d+)-/)
    return match ? parseInt(match[1]) : null
  }

  /**
   * Extract occupations
   */
  extractOccupations(entity) {
    const occupationClaims = entity.claims?.P106 // occupation
    if (!occupationClaims) return []

    const occupations = []

    for (const claim of occupationClaims.slice(0, 3)) {
      // Take first 3
      const occupationId = claim.mainsnak?.datavalue?.value?.id
      if (occupationId) {
        const category = this.mapOccupationToCategory(occupationId)
        if (category && !occupations.includes(category)) {
          occupations.push(category)
        }
      }
    }

    return occupations.length > 0 ? occupations : ['other']
  }

  /**
   * Map Wikidata occupation Q-ID to our category
   */
  mapOccupationToCategory(occupationQId) {
    const occupationMap = {
      // Music
      Q36834: 'music', // composer
      Q486748: 'music', // pianist
      Q639669: 'music', // musician
      Q177220: 'music', // singer
      Q855091: 'music', // guitarist
      Q158852: 'music', // conductor
      Q753110: 'music', // songwriter
      // Philosophy
      Q4964182: 'philosophy', // philosopher
      Q81096: 'philosophy', // philosopher (alt)
      // Science
      Q901: 'science', // scientist
      Q169470: 'science', // physicist
      Q593644: 'science', // chemist
      Q170790: 'science', // mathematician
      Q11063: 'science', // astronomer
      Q864503: 'science', // biologist
      Q350979: 'science', // engineer
      Q15976092: 'science', // inventor
      Q81096: 'science', // architect (sometimes)
      // Politics
      Q82955: 'politics', // politician
      Q30461: 'politics', // president
      Q484876: 'politics', // prime minister
      Q116: 'politics', // monarch
      Q2285706: 'politics', // head of state
      Q372436: 'politics', // statesman
      // Art
      Q1028181: 'art', // painter
      Q1281618: 'art', // sculptor
      Q33999: 'art', // actor
      Q2490358: 'art', // choreographer
      Q3282637: 'art', // film director
      Q644687: 'art', // illustrator
      Q11629: 'art', // photographer
      // Judaism
      Q49833: 'judaism', // rabbi
      Q152002: 'judaism', // Torah scholar
      Q3400985: 'judaism', // kabbalist
      Q42603: 'judaism', // priest (kohen)
      // Religions
      Q36524: 'religions', // religious leader
      Q191808: 'religions', // theologian
      Q955464: 'religions', // clergyman
      Q250867: 'religions', // Catholic priest
      Q1826170: 'religions', // missionary
      Q42857: 'religions', // pastor
      // Literature (maps to existing categories if available)
      Q36180: 'art', // writer -> art
      Q49757: 'art', // poet -> art
      Q1930187: 'philosophy' // historian -> philosophy
    }

    return occupationMap[occupationQId] || null
  }

  /**
   * Extract birth place - resolves city to country if needed
   */
  async extractBirthPlace(entity) {
    const birthPlaceClaim = entity.claims?.P19 // place of birth
    if (!birthPlaceClaim || birthPlaceClaim.length === 0) return null

    const placeId = birthPlaceClaim[0].mainsnak?.datavalue?.value?.id
    // Try direct match first (might be a country)
    const direct = this.mapPlaceToRegion(placeId)
    if (direct) return direct

    // If not a country, resolve via P17 (country property of the place)
    return await this.resolveCountryFromPlace(placeId)
  }

  /**
   * Extract citizenship
   */
  async extractCitizenship(entity) {
    const citizenshipClaim = entity.claims?.P27 // country of citizenship
    if (!citizenshipClaim || citizenshipClaim.length === 0) return null

    const countryId = citizenshipClaim[0].mainsnak?.datavalue?.value?.id
    return this.mapPlaceToRegion(countryId)
  }

  /**
   * Resolve a place (city/town) to a region by fetching its P17 (country) property
   */
  async resolveCountryFromPlace(placeQId) {
    try {
      const url = `https://www.wikidata.org/wiki/Special:EntityData/${placeQId}.json`
      const response = await fetch(url)
      const data = await response.json()
      const entity = data.entities[placeQId]
      if (!entity) return null

      // Get P17 (country)
      const countryClaim = entity.claims?.P17
      if (!countryClaim || countryClaim.length === 0) return null

      const countryId = countryClaim[0].mainsnak?.datavalue?.value?.id
      return this.mapPlaceToRegion(countryId)
    } catch (err) {
      console.warn('Could not resolve place to country:', placeQId, err)
      return null
    }
  }

  /**
   * Map Wikidata country Q-ID to our region/location system
   */
  mapPlaceToRegion(placeQId) {
    const regionMap = {
      // Western Europe
      Q183: 'western_europe', // Germany
      Q142: 'western_europe', // France
      Q40: 'western_europe', // Austria
      Q55: 'western_europe', // Netherlands
      Q39: 'western_europe', // Switzerland
      Q31: 'western_europe', // Belgium
      Q32: 'western_europe', // Luxembourg
      // Southern Europe
      Q38: 'southern_europe', // Italy
      Q29: 'southern_europe', // Spain
      Q45: 'southern_europe', // Portugal
      Q41: 'southern_europe', // Greece
      // Britain
      Q145: 'britain', // United Kingdom
      Q22: 'britain', // Scotland
      Q21: 'britain', // England
      Q25: 'britain', // Wales
      Q27: 'britain', // Ireland
      // Eastern Europe
      Q159: 'eastern_europe', // Russia
      Q36: 'eastern_europe', // Poland
      Q213: 'eastern_europe', // Czech Republic
      Q28: 'eastern_europe', // Hungary
      Q217: 'eastern_europe', // Moldova
      Q212: 'eastern_europe', // Ukraine
      Q184: 'eastern_europe', // Belarus
      Q218: 'eastern_europe', // Romania
      Q219: 'eastern_europe', // Bulgaria
      Q403: 'eastern_europe', // Serbia
      Q224: 'eastern_europe', // Croatia
      Q37: 'eastern_europe', // Lithuania
      Q211: 'eastern_europe', // Latvia
      Q191: 'eastern_europe', // Estonia
      Q15180: 'eastern_europe', // Russian Empire
      Q34266: 'eastern_europe', // Russian SFSR
      Q33946: 'eastern_europe', // Czechoslovakia
      Q70972: 'eastern_europe', // Kingdom of France (historical)
      // Scandinavia → western_europe
      Q34: 'western_europe', // Sweden
      Q35: 'western_europe', // Denmark
      Q33: 'western_europe', // Finland
      Q20: 'western_europe', // Norway
      // North America
      Q30: 'north_america', // United States
      Q16: 'north_america', // Canada
      Q96: 'north_america', // Mexico
      // South America
      Q155: 'south_america', // Brazil
      Q414: 'south_america', // Argentina
      Q77: 'south_america', // Uruguay
      Q298: 'south_america', // Chile
      Q736: 'south_america', // Ecuador
      Q739: 'south_america', // Colombia
      // Asia
      Q148: 'asia', // China
      Q17: 'asia', // Japan
      Q668: 'asia', // India
      Q884: 'asia', // South Korea
      Q43: 'asia', // Turkey
      Q423: 'asia', // North Korea
      Q851: 'asia', // Saudi Arabia
      Q794: 'asia', // Iran
      Q796: 'asia', // Iraq
      // Israel
      Q801: 'israel', // Israel
      Q219060: 'israel', // State of Palestine
      // Africa
      Q258: 'africa', // South Africa
      Q262: 'africa', // Algeria
      Q1028: 'africa', // Morocco
      Q114: 'africa', // Kenya
      Q115: 'africa', // Ethiopia
      Q79: 'africa', // Egypt
      // Oceania
      Q408: 'oceania', // Australia
      Q664: 'oceania' // New Zealand
    }

    return regionMap[placeQId] || null
  }

  /**
   * Extract image URL
   */
  async extractImage(entity) {
    const imageClaim = entity.claims?.P18 // image
    if (!imageClaim || imageClaim.length === 0) return null

    const filename = imageClaim[0].mainsnak?.datavalue?.value
    if (!filename) return null

    // Convert to Wikimedia Commons URL
    const encodedFilename = encodeURIComponent(filename.replace(/ /g, '_'))
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFilename}?width=300`
  }

  /**
   * Extract description
   */
  extractDescription(entity) {
    return entity.descriptions?.he?.value || entity.descriptions?.en?.value || ''
  }
}

export default new WikidataService()
