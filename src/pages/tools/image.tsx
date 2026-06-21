import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Image as ImageIcon, Upload, Loader2, ScanText, Eye, FileSearch, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const actions = [
  { value: "ocr", label: "OCR / Text Extract", icon: Type },
  { value: "detect-objects", label: "Detect Objects", icon: ScanText },
  { value: "analyze-scene", label: "Analyze Scene", icon: Eye },
  { value: "extract-text", label: "Smart Extract", icon: FileSearch },
];

export default function ImageVision() {
  const [, navigate] = useLocation();
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [action, setAction] = useState("ocr");
  const [result, setResult] = useState("");

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImage(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const imageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/image", {
        imageBase64: image,
        action,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
    },
  });

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      
      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SwadeshLogo size="sm" animated={false} />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-india-green-500/20 to-india-green-600/10 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-india-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Image Vision</h1>
            <p className="text-muted-foreground">OCR, object detection, and scene analysis</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Upload Image</h2>
            
            {!image ? (
              <label htmlFor="image-upload" className="cursor-pointer block">
                <Card className="p-12 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Supports JPG, PNG, GIF
                  </p>
                </Card>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-image"
                />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={`data:image/jpeg;base64,${image}`}
                    alt="Uploaded"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImage(null);
                      setImageName("");
                      setResult("");
                    }}
                    data-testid="button-clear-image"
                  >
                    Change
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{imageName}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {actions.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setAction(a.value)}
                    className={cn(
                      "p-3 rounded-md text-left transition-all text-sm",
                      action === a.value
                        ? "bg-india-green-500/20 ring-2 ring-india-green-500"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                    data-testid={`button-action-${a.value}`}
                  >
                    <a.icon className="w-4 h-4 mb-1" />
                    {a.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => imageMutation.mutate()}
                disabled={!image || imageMutation.isPending}
                className="w-full bg-gradient-to-r from-india-green-500 to-india-blue-500 hover:from-india-green-600 hover:to-india-blue-600"
                data-testid="button-analyze"
              >
                {imageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">Analysis Result</h2>
            {result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload an image and select an action to analyze
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
