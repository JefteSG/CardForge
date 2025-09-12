"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Wand2, RefreshCw, Upload } from "lucide-react"
import { AI_PROMPTS } from "../config/constants.js"
import { cardForgeAPI } from "../services/api"
import { toast } from "sonner"

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
  const [uploading, setUploading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const response = await cardForgeAPI.generateImage(prompt, cardType)

      if (response.success && response.data) {
        onImageGenerated(response.data.imageUrl, response.data.prompt)
        toast.success("Image generated successfully!")
      } else {
        toast.error(response.error || "Failed to generate image")
        console.error("Image generation failed:", response.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    setUploading(true)
    try {
      const response = await cardForgeAPI.uploadImage(file)

      if (response.success && response.data) {
        onImageGenerated(response.data.imageUrl, `Uploaded: ${file.name}`)
        toast.success("Image uploaded successfully!")
      } else {
        toast.error(response.error || "Failed to upload image")
        console.error("Image upload failed:", response.error)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
      // Reset the input
      event.target.value = ""
    }
  }

  const getRandomPrompt = () => {
    const prompts = AI_PROMPTS[cardType as keyof typeof AI_PROMPTS] || AI_PROMPTS.creature
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(randomPrompt)
  }

  const currentlyGenerating = loading || isGenerating
  const currentlyUploading = uploading

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
          {currentlyGenerating ? "Generating..." : "Generate with AI"}
        </Button>

        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={currentlyUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Upload custom image"
          />
          <Button variant="outline" disabled={currentlyUploading} title="Upload custom image">
            {currentlyUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {currentPrompt && (
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm">Current prompt:</Label>
          <p className="text-sm text-muted-foreground mt-1">{currentPrompt}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 Tip: Be specific about style, colors, and mood for better results</p>
        <p>📁 Supported formats: JPG, PNG, WEBP (max 10MB)</p>
      </div>
    </div>
  )
}
