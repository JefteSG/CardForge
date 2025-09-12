import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Download, FileImage, FileText, Printer } from 'lucide-react';
import { CardPreview } from './CardPreview';

interface Card {
  id: string;
  title: string;
  description: string;
  rarity: string;
  type: string;
  collection: string;
  imageUrl: string;
  imagePrompt: string;
  variant: string;
  createdAt: Date;
}

interface ExportDialogProps {
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ card, open, onOpenChange }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'json'>('png');
  const [resolution, setResolution] = useState<'low' | 'medium' | 'high' | 'print'>('medium');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  const resolutionOptions = {
    low: { width: 256, height: 384, dpi: 72, label: 'Low (256x384)' },
    medium: { width: 512, height: 768, dpi: 150, label: 'Medium (512x768)' },
    high: { width: 1024, height: 1536, dpi: 200, label: 'High (1024x1536)' },
    print: { width: 2480, height: 3508, dpi: 300, label: 'Print Ready (300 DPI)' }
  };

  const handleExport = async () => {
    try {
      if (exportFormat === 'json') {
        // Export as JSON
        const jsonData = {
          ...card,
          exportSettings: {
            format: exportFormat,
            resolution: resolutionOptions[resolution],
            includeBackground,
            includeMetadata,
            exportedAt: new Date().toISOString()
          }
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${card.title || 'card'}.json`);
      } else {
        // Export as image (PNG/PDF)
        // In a real implementation, this would render the card to canvas and export
        await exportAsImage();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const exportAsImage = async () => {
    // Mock implementation - in real app, this would:
    // 1. Create a canvas with the card design
    // 2. Render the card with proper styling and resolution
    // 3. Convert to blob and download
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const res = resolutionOptions[resolution];
    
    canvas.width = res.width;
    canvas.height = res.height;
    
    if (!ctx) return;
    
    // Simple mock export - just create a colored rectangle with text
    if (includeBackground) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Add card title
    ctx.fillStyle = '#000';
    ctx.font = `${Math.floor(res.width / 20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(card.title || 'Card Name', canvas.width / 2, res.width / 10);
    
    // Add "Mock Export" text
    ctx.font = `${Math.floor(res.width / 30)}px Arial`;
    ctx.fillText('Mock Export', canvas.width / 2, canvas.height - res.width / 20);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const extension = exportFormat === 'pdf' ? 'pdf' : 'png';
        downloadFile(blob, `${card.title || 'card'}.${extension}`);
      }
    }, `image/${exportFormat === 'pdf' ? 'png' : 'png'}`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  const getEstimatedFileSize = () => {
    const res = resolutionOptions[resolution];
    const baseSize = (res.width * res.height * 4) / 1024 / 1024; // Rough estimate in MB
    
    switch (exportFormat) {
      case 'png':
        return `~${(baseSize * 0.3).toFixed(1)} MB`;
      case 'pdf':
        return `~${(baseSize * 0.2).toFixed(1)} MB`;
      case 'json':
        return '< 1 KB';
      default:
        return 'Unknown';
    }
  };

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

            {exportFormat !== 'json' && (
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
                <Checkbox
                  id="background"
                  checked={includeBackground}
                  onCheckedChange={setIncludeBackground}
                />
                <Label htmlFor="background" className="text-sm">
                  Include background
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
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
              {exportFormat !== 'json' && (
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

            <Button onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Card
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Export Preview</Label>
            <div className="flex justify-center">
              <CardPreview card={card} className="scale-75" />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              This is how your card will look when exported
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
