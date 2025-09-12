"use client"

import { useState, useEffect } from "react"
import { CardBuilder } from "./components/CardBuilder"
import { CardGallery } from "./components/CardGallery"
import { CardPreview } from "./components/CardPreview"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Local interface to avoid API dependency on initial load
interface CardData {
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
  updatedAt?: Date
}

export default function App() {
  const [cards, setCards] = useState<CardData[]>([])
  const [currentView, setCurrentView] = useState<"gallery" | "builder">("gallery")
  const [editingCard, setEditingCard] = useState<CardData | null>(null)
  const [viewingCard, setViewingCard] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("offline")
  const [apiAvailable, setApiAvailable] = useState(false)

  // Initialize app with local data first, then try to connect to API
  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    setLoading(true)

    // First, create sample cards locally for immediate use
    const localCards = createLocalSampleCards()
    setCards(localCards)
    setLoading(false)

    // Then try to connect to the API in the background
    try {
      const { cardForgeAPI } = await import("./services/api")
      setServerStatus("checking")

      const healthResponse = await cardForgeAPI.healthCheck()

      if (healthResponse.success) {
        setServerStatus("online")
        setApiAvailable(true)

        // Try to load cards from server
        const cardsResponse = await cardForgeAPI.getCards()

        if (cardsResponse.success && cardsResponse.data) {
          setCards(cardsResponse.data)

          if (cardsResponse.data.length === 0) {
            // Create sample cards on server
            await createServerSampleCards(cardForgeAPI)
          }
        }
      } else {
        setServerStatus("offline")
        toast.info("Running in offline mode with sample data")
      }
    } catch (error) {
      console.log("API not available, running in offline mode:", error)
      setServerStatus("offline")
      toast.info("Running in offline mode with sample data")
    }
  }

  const createLocalSampleCards = (): CardData[] => {
    return [
      {
        id: crypto.randomUUID(),
        title: "Ancient Dragon",
        description:
          "A legendary creature with the power to control fire and shadow. When summoned, all enemy creatures take 3 damage.",
        rarity: "legendary" as const,
        type: "creature" as const,
        collection: "Mythic Beasts",
        imageUrl:
          "https://images.unsplash.com/photo-1543111576-b87dc343c1f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMGRyYWdvbiUyMGNyZWF0dXJlJTIwZmFudGFzeXxlbnwxfHx8fDE3NTc2MzY5OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        imagePrompt: "mystical dragon with glowing eyes",
        variant: "normal" as const,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        title: "Lightning Bolt",
        description: "Deal 4 damage to any target. If target is destroyed, draw a card.",
        rarity: "common" as const,
        type: "spell" as const,
        collection: "Elemental Magic",
        imageUrl:
          "https://images.unsplash.com/photo-1723732274324-36744e7b21b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWdpY2FsJTIwc3BlbGwlMjBsaWdodG5pbmclMjBlbmVyZ3l8ZW58MXx8fHwxNzU3NjM2OTk5fDA&ixlib=rb-4.1.0&q=80&w=1080",
        imagePrompt: "lightning bolt striking ground",
        variant: "shiny" as const,
        createdAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        title: "Blade of Eternity",
        description: "Legendary artifact weapon. +5 attack to equipped creature. Indestructible.",
        rarity: "mythic" as const,
        type: "artifact" as const,
        collection: "Ancient Relics",
        imageUrl:
          "https://images.unsplash.com/photo-1672672088809-59acb7ad0e3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYXJ0aWZhY3QlMjBzd29yZCUyMHdlYXBvbnxlbnwxfHx8fDE3NTc2MzcwMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
        imagePrompt: "ancient magical sword with runes",
        variant: "holographic" as const,
        createdAt: new Date(),
      },
    ]
  }

  const createServerSampleCards = async (cardForgeAPI: any) => {
    const sampleCards = createLocalSampleCards()

    try {
      const createdCards = []
      for (const cardData of sampleCards) {
        const response = await cardForgeAPI.createCard(cardData)
        if (response.success && response.data) {
          createdCards.push(response.data)
        }
      }

      if (createdCards.length > 0) {
        setCards(createdCards)
        toast.success(`Created ${createdCards.length} sample cards on server!`)
      }
    } catch (error) {
      console.error("Error creating sample cards on server:", error)
    }
  }

  const handleCreateNew = () => {
    setEditingCard(null)
    setCurrentView("builder")
  }

  const handleEditCard = (card: CardData) => {
    setEditingCard(card)
    setCurrentView("builder")
  }

  const handleSaveCard = async (card: CardData) => {
    if (!apiAvailable) {
      // Handle offline mode
      if (editingCard) {
        setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)))
        toast.success("Card updated locally (offline mode)")
      } else {
        const newCard = { ...card, id: crypto.randomUUID(), createdAt: new Date() }
        setCards((prev) => [newCard, ...prev])
        toast.success("Card created locally (offline mode)")
      }
      setCurrentView("gallery")
      setEditingCard(null)
      return
    }

    // Handle online mode
    try {
      const { cardForgeAPI } = await import("./services/api")
      let response

      if (editingCard) {
        response = await cardForgeAPI.updateCard(card.id, card)

        if (response.success && response.data) {
          setCards((prev) => prev.map((c) => (c.id === card.id ? response.data! : c)))
          toast.success("Card updated successfully!")
        }
      } else {
        response = await cardForgeAPI.createCard(card)

        if (response.success && response.data) {
          setCards((prev) => [response.data!, ...prev])
          toast.success("Card created successfully!")
        }
      }

      if (response?.success) {
        setCurrentView("gallery")
        setEditingCard(null)
      } else {
        toast.error(response?.error || "Failed to save card")
      }
    } catch (error) {
      console.error("Error saving card:", error)
      toast.error("Failed to save card")
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!apiAvailable) {
      // Handle offline mode
      setCards((prev) => prev.filter((c) => c.id !== cardId))
      toast.success("Card deleted locally (offline mode)")

      if (editingCard?.id === cardId) {
        setCurrentView("gallery")
        setEditingCard(null)
      }
      return
    }

    // Handle online mode
    try {
      const { cardForgeAPI } = await import("./services/api")
      const response = await cardForgeAPI.deleteCard(cardId)

      if (response.success) {
        setCards((prev) => prev.filter((c) => c.id !== cardId))
        toast.success("Card deleted successfully!")

        if (editingCard?.id === cardId) {
          setCurrentView("gallery")
          setEditingCard(null)
        }
      } else {
        toast.error(response.error || "Failed to delete card")
      }
    } catch (error) {
      console.error("Error deleting card:", error)
      toast.error("Failed to delete card")
    }
  }

  const handleViewCard = (card: CardData) => {
    setViewingCard(card)
  }

  const handleRetryConnection = () => {
    setServerStatus("checking")
    initializeApp()
  }

  // Show loading screen while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">CardForge</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading application...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">CardForge</h1>
                <p className="text-sm text-muted-foreground">Create custom game cards with AI • {cards.length} cards</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    serverStatus === "online"
                      ? "bg-green-500"
                      : serverStatus === "checking"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
                <span className="text-sm text-muted-foreground">
                  {serverStatus === "online" ? "Online" : serverStatus === "checking" ? "Connecting..." : "Offline"}
                </span>
                {serverStatus === "offline" && (
                  <Button variant="ghost" size="sm" onClick={handleRetryConnection} className="text-xs ml-2">
                    Retry
                  </Button>
                )}
              </div>

              <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
                <TabsList>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="builder">Builder</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      {/* Offline Mode Banner */}
      {serverStatus === "offline" && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="container mx-auto">
            <p className="text-sm text-yellow-800">
              ⚡ Running in offline mode with sample data. Connect to server for full functionality.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
          <TabsContent value="gallery" className="mt-0">
            <CardGallery
              cards={cards}
              onCreateNew={handleCreateNew}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onViewCard={handleViewCard}
            />
          </TabsContent>

          <TabsContent value="builder" className="mt-0">
            <CardBuilder
              initialCard={editingCard || undefined}
              onSave={handleSaveCard}
              onDelete={editingCard ? () => handleDeleteCard(editingCard.id) : undefined}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Card View Dialog */}
      {viewingCard && (
        <Dialog open={!!viewingCard} onOpenChange={() => setViewingCard(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{viewingCard.title}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <CardPreview card={viewingCard} />
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Type:</strong> {viewingCard.type}
              </p>
              <p>
                <strong>Rarity:</strong> {viewingCard.rarity}
              </p>
              <p>
                <strong>Collection:</strong> {viewingCard.collection}
              </p>
              <p>
                <strong>Created:</strong> {viewingCard.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewingCard(null)
                  handleEditCard(viewingCard)
                }}
                className="flex-1"
              >
                Edit Card
              </Button>
              <Button variant="outline" onClick={() => setViewingCard(null)} className="flex-1">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
