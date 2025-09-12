interface UnsplashImageResponse {
  imageUrl: string
  prompt: string
  generatedAt: string
}

interface UnsplashApiResponse {
  success: boolean
  data?: UnsplashImageResponse
  error?: string
}

/**
 * Fetches an image from Unsplash based on search keywords
 * @param prompt - The search prompt/keywords
 * @param cardType - The type of card (for better keyword optimization)
 * @returns Promise with image URL and metadata
 */
export async function unsplash_tool(prompt: string, cardType = "general"): Promise<UnsplashApiResponse> {
  try {
    // Extract and optimize keywords for better Unsplash results
    const keywords = extractAndOptimizeKeywords(prompt, cardType)

    // Generate Unsplash URL with optimized parameters
    const imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(keywords)}`

    return {
      success: true,
      data: {
        imageUrl,
        prompt: keywords,
        generatedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Unsplash tool error:", error)

    // Fallback to a generic fantasy image
    return {
      success: false,
      error: "Failed to fetch image from Unsplash",
      data: {
        imageUrl: "https://source.unsplash.com/1024x1024/?fantasy,game,art",
        prompt: "fantasy game art",
        generatedAt: new Date().toISOString(),
      },
    }
  }
}

/**
 * Extracts keywords from prompt and optimizes them for Unsplash search
 */
function extractAndOptimizeKeywords(prompt: string, cardType: string): string {
  // Common stop words to remove
  const stopWords = [
    "a",
    "an",
    "the",
    "with",
    "and",
    "or",
    "but",
    "from",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "by",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
  ]

  // Extract meaningful keywords from prompt
  const promptKeywords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 4) // Limit to 4 keywords for better results

  // Add card type specific keywords
  const typeKeywords = getCardTypeKeywords(cardType)

  // Combine and deduplicate keywords
  const allKeywords = [...promptKeywords, ...typeKeywords]
  const uniqueKeywords = [...new Set(allKeywords)]

  // Join with commas for Unsplash URL
  return uniqueKeywords.slice(0, 5).join(",")
}

/**
 * Returns relevant keywords based on card type
 */
function getCardTypeKeywords(cardType: string): string[] {
  const typeMap: Record<string, string[]> = {
    creature: ["fantasy", "creature", "monster", "beast"],
    spell: ["magic", "spell", "energy", "mystical"],
    artifact: ["ancient", "artifact", "relic", "treasure"],
    enchantment: ["magical", "enchanted", "glowing", "ethereal"],
    general: ["fantasy", "game", "art"],
  }

  return typeMap[cardType.toLowerCase()] || typeMap.general
}

/**
 * Alternative function for direct URL generation (backward compatibility)
 */
export function generateUnsplashUrl(keywords: string, width = 1024, height = 1024): string {
  const cleanKeywords = keywords.replace(/[^\w\s,]/g, "").trim()
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(cleanKeywords)}`
}

/**
 * Validates if an Unsplash URL is accessible
 */
export async function validateUnsplashImage(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

// Default export for easier importing
export default unsplash_tool
