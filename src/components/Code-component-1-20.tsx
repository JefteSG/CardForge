"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Loader2, Wand2, RefreshCw } from "lucide-react"
import { AI_PROMPTS } from "../config/constants.js"
import { unsplash_tool } from "../tools/unsplash_tool"

interface AIImageGeneratorProps {
  cardType: string
  onImageGenerated: (imageUrl: string, prompt: string) => void
  currentPrompt?: string
  isGenerating?: boolean
}

export function AIImageGenerator({
  cardType,
  onImageGenerated,
  currentPrompt = "",
  isGenerating = false,
}: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState(currentPrompt)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      // Mock API call - in real implementation this would call OpenAI DALL-E or Stability AI
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API delay

      const result = await unsplash_tool(prompt, cardType)
      if (result.success && result.data) {
        onImageGenerated(result.data.imageUrl, result.data.prompt)
      } else {
        // Fallback to a default image
        onImageGenerated("/api/placeholder/256/128", prompt)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      // Fallback to a default image
      onImageGenerated("/api/placeholder/256/128", prompt)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnsplashImage = async (searchPrompt: string): Promise<string> => {
    try {
      // Extract keywords from prompt for better Unsplash search
      const keywords = extractKeywords(searchPrompt)
      // This would use the unsplash_tool in real implementation
      return `https://source.unsplash.com/400x300/?${keywords}`
    } catch {
      return "/api/placeholder/400/300"
    }
  }

  const extractKeywords = (text: string): string => {
    // Simple keyword extraction - remove common words and join remaining
    const stopWords = ["a", "an", "the", "with", "and", "or", "but", "from", "of"]
    return text
      .toLowerCase()
      .split(" ")
      .filter((word) => !stopWords.includes(word) && word.length > 2)
      .slice(0, 3)
      .join(",")
  }

  const getRandomPrompt = () => {
    const prompts = AI_PROMPTS[cardType as keyof typeof AI_PROMPTS] || AI_PROMPTS.creature
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(randomPrompt)
  }

  const currentlyGenerating = loading || isGenerating

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ai-prompt">AI Image Prompt</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            disabled={currentlyGenerating}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={getRandomPrompt}
            disabled={currentlyGenerating}
            title="Random prompt"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={!prompt.trim() || currentlyGenerating} className="flex-1">
          {currentlyGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
          {currentlyGenerating ? "Generating..." : "Generate Image"}
        </Button>
      </div>

      {currentPrompt && (
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm">Current prompt:</Label>
          <p className="text-sm text-muted-foreground mt-1">{currentPrompt}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        💡 Tip: Be specific about style, colors, and mood for better results
      </div>
    </div>
  )
}
