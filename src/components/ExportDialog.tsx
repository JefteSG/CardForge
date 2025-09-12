"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Download, FileImage, FileText, Printer } from "lucide-react"
import { CardPreview } from "./CardPreview"

declare global {
  interface Window {
    html2canvas: any
  }
}

interface Card {
  id: string
  title: string
  description: string
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
  type: "creature" | "spell" | "artifact" | "enchantment"
  collection: string
  imageUrl: string
  imagePrompt: string
  variant: "normal" | "shiny" | "holographic" | "first-edition"
  createdAt: Date
}

interface ExportDialogProps {
  card: Card
  open: boolean
  onOpenChange: (open: boolean) => void
}


export function ExportDialog({ card, open, onOpenChange }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"png" | "pdf" | "json">("png")
  const [resolution, setResolution] = useState<"low" | "medium" | "high" | "print">("medium")
  const [includeBackground, setIncludeBackground] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const cardPreviewRef = useRef<HTMLDivElement>(null)

  const resolutionOptions = {
    low: { width: 256, height: 384, dpi: 72, label: "Low (256x384)" },
    medium: { width: 512, height: 768, dpi: 150, label: "Medium (512x768)" },
    high: { width: 1024, height: 1536, dpi: 200, label: "High (1024x1536)" },
    print: { width: 2480, height: 3508, dpi: 300, label: "Print Ready (300 DPI)" },
  }

  const loadHtml2Canvas = async () => {
    if (typeof window !== "undefined" && !window.html2canvas) {
      console.log("[v0] Loading html2canvas library...")

      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
      script.crossOrigin = "anonymous"

      // Add timeout for loading
      const timeout = setTimeout(() => {
        document.head.removeChild(script)
        throw new Error("html2canvas library loading timeout")
      }, 10000) // 10 second timeout

      document.head.appendChild(script)

      return new Promise((resolve, reject) => {
        script.onload = () => {
          clearTimeout(timeout)
          console.log("[v0] html2canvas library loaded successfully")
          resolve(window.html2canvas)
        }
        script.onerror = (error) => {
          clearTimeout(timeout)
          document.head.removeChild(script)
          console.error("[v0] Failed to load html2canvas library:", error)
          reject(new Error("Failed to load html2canvas library"))
        }
      })
    }
    return window.html2canvas
  }

  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)

      if (exportFormat === "json") {
        const jsonData = {
          ...card,
          exportSettings: {
            format: exportFormat,
            resolution: resolutionOptions[resolution],
            includeBackground,
            includeMetadata,
            exportedAt: new Date().toISOString(),
          },
        }

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
        downloadFile(blob, `${card.title || "card"}.json`)
      } else {
        await exportAsImage()
      }
    } catch (error) {
      console.error("Export failed:", error)

      let errorMessage = "Export failed. Please try again."

      if (error instanceof Error) {
        if (error.message.includes("html2canvas")) {
          errorMessage = "Failed to load image capture library. Please check your internet connection and try again."
        } else if (error.message.includes("canvas")) {
          errorMessage = "Failed to capture card image. Please try a different resolution or check the card content."
        } else if (error.message.includes("blob")) {
          errorMessage = "Failed to generate image file. Please try again."
        }
      }

      alert(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsImage = async () => {
    // Use the visible preview for export
    if (!cardPreviewRef.current) {
      throw new Error("Card preview element not found")
    }

    // Wait longer for the element to be fully rendered and styles to be applied
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if element has proper dimensions
    const rect = cardPreviewRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      throw new Error("Card preview has no dimensions")
    }

    // Force style computation
    cardPreviewRef.current.offsetHeight

    try {
      const html2canvas = await loadHtml2Canvas()

      if (!html2canvas) {
        throw new Error("html2canvas library failed to load")
      }

      const res = resolutionOptions[resolution]
      const scaleX = res.width / cardPreviewRef.current.offsetWidth
      const scaleY = res.height / cardPreviewRef.current.offsetHeight
      const scale = Math.min(scaleX, scaleY)

      console.log("[v0] Starting card export with scale:", scale)

      const canvas = await html2canvas(cardPreviewRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: includeBackground ? "#ffffff" : null,
        width: cardPreviewRef.current.offsetWidth,
        height: cardPreviewRef.current.offsetHeight,
        logging: false,
        letterRendering: true,
        foreignObjectRendering: false,
        ignoreElements: (element: Element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE'
        },
        removeContainer: true,
        imageTimeout: 0,
        proxy: undefined,
        onclone: (clonedDoc: Document) => {
          // Force computation of all styles for the card preview
          const element = clonedDoc.querySelector('[data-card-preview]')
          if (element) {
            const htmlElement = element as HTMLElement
            const computedStyle = window.getComputedStyle(htmlElement)

            // Apply computed styles inline to ensure they're captured
            htmlElement.style.cssText = computedStyle.cssText

            // Force layout computation
            htmlElement.offsetHeight
          }

          // Handle images with proper CORS
          const images = clonedDoc.querySelectorAll("img")
          images.forEach((img) => {
            if (img.src.startsWith("blob:") || img.src.startsWith("data:")) {
              img.crossOrigin = "anonymous"
            }
            // Force image load
            img.style.display = 'block'
          })

          // Force computation for all child elements
          const allElements = clonedDoc.querySelectorAll('[data-card-preview] *')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            if (htmlEl.style) {
              // Force layout computation
              htmlEl.offsetHeight
              htmlEl.offsetWidth
            }
          })

          // Force a reflow to ensure styles are applied
          if (element) {
            ;(element as HTMLElement).getBoundingClientRect()
          }
        },
      })

      console.log("[v0] Canvas created with dimensions:", canvas.width, "x", canvas.height)

      canvas.toBlob(
        (blob: Blob | null) => {
          if (blob) {
            const extension = exportFormat === "pdf" ? "png" : "png"
            downloadFile(blob, `${card.title || "card"}.${extension}`)
            console.log("[v0] Export completed successfully")
          } else {
            throw new Error("Failed to create blob from canvas")
          }
        },
        "image/png",
        0.95,
      )
    } catch (error) {
      console.error("[v0] Export error:", error)

      if (error instanceof Error) {
        if (error.message.includes("html2canvas")) {
          throw new Error("Image capture library failed to load")
        } else if (error.message.includes("canvas")) {
          throw new Error("Failed to create canvas from card preview")
        }
      }

      console.log("[v0] Falling back to simple canvas rendering")
      await fallbackCanvasExport()
    }
  }

  const fallbackCanvasExport = async () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const res = resolutionOptions[resolution]

    canvas.width = res.width
    canvas.height = res.height

    if (!ctx) return

    if (includeBackground) {
      ctx.fillStyle = "#f8f9fa"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.strokeStyle = "#e9ecef"
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    ctx.fillStyle = "#212529"
    ctx.font = `bold ${Math.floor(res.width / 15)}px Arial`
    ctx.textAlign = "center"
    ctx.fillText(card.title || "Card Name", canvas.width / 2, res.width / 8)

    ctx.font = `${Math.floor(res.width / 25)}px Arial`
    ctx.fillText(`${card.type} • ${card.rarity}`, canvas.width / 2, res.width / 6)

    ctx.fillStyle = "#6c757d"
    ctx.font = `${Math.floor(res.width / 30)}px Arial`
    const description = card.description || "No description available"
    const words = description.split(" ")
    const maxWidth = canvas.width - 80
    let line = ""
    let y = canvas.height / 2

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " "
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y)
        line = words[n] + " "
        y += Math.floor(res.width / 25)
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, canvas.width / 2, y)

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `${card.title || "card"}.png`)
      }
    }, "image/png")
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  const getEstimatedFileSize = () => {
    const res = resolutionOptions[resolution]
    const baseSize = (res.width * res.height * 4) / 1024 / 1024 // Rough estimate in MB

    switch (exportFormat) {
      case "png":
        return `~${(baseSize * 0.3).toFixed(1)} MB`
      case "pdf":
        return `~${(baseSize * 0.2).toFixed(1)} MB`
      case "json":
        return "< 1 KB"
      default:
        return "Unknown"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export Card</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Settings */}
          <div className="space-y-6">
            <div>
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      PNG Image
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      PDF (Print Ready)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportFormat !== "json" && (
              <div>
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(value: any) => setResolution(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(resolutionOptions).map(([key, option]) => (
                      <SelectItem key={key} value={key}>
                        {option.label} - {option.dpi} DPI
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Export Options */}
            <div className="space-y-3">
              <Label>Export Options</Label>

              <div className="flex items-center space-x-2">
                <Checkbox id="background" checked={includeBackground} onCheckedChange={(checked) => setIncludeBackground(checked === true)} />
                <Label htmlFor="background" className="text-sm">
                  Include background
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={(checked) => setIncludeMetadata(checked === true)} />
                <Label htmlFor="metadata" className="text-sm">
                  Include metadata
                </Label>
              </div>
            </div>

            <Separator />

            {/* Export Info */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Format:</span>
                <span className="font-medium">{exportFormat.toUpperCase()}</span>
              </div>
              {exportFormat !== "json" && (
                <div className="flex justify-between text-sm">
                  <span>Resolution:</span>
                  <span className="font-medium">
                    {resolutionOptions[resolution].width}x{resolutionOptions[resolution].height}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Estimated size:</span>
                <span className="font-medium">{getEstimatedFileSize()}</span>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Card"}
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Export Preview</Label>
            <div className="flex justify-center">
              <div ref={cardPreviewRef}>
                <CardPreview card={card} className="scale-75" />
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              This is how your card will look when exported
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
