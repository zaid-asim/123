import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ScanText, Upload, Loader2, Copy, Download, CheckCircle, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OCRPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string>("");
    const [mimeType, setMimeType] = useState("image/jpeg");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const ocrMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/tools/ocr", { imageBase64, mimeType });
            const data = await res.json();
            return data.result as string;
        },
        onSuccess: (data) => setResult(data),
        onError: () => toast({ title: "Text extraction failed. Try a clearer image.", variant: "destructive" }),
    });

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast({ title: "Please upload an image file", variant: "destructive" }); return;
        }
        setMimeType(file.type);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setImagePreview(dataUrl);
            const base64 = dataUrl.split(",")[1];
            setImageBase64(base64);
            setResult("");
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const copyText = () => {
        navigator.clipboard.writeText(result);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const downloadText = () => {
        const blob = new Blob([result], { type: "text/plain" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = "extracted-text.txt"; a.click();
    };

    return (
        <div className="min-h-screen bg-background relative">
            <ParticleBackground />
            <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
                        <SwadeshLogo size="sm" animated={false} />
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 pt-24 pb-12 max-w-5xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                        <ScanText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-tricolor">OCR Text Extractor</h1>
                        <p className="text-sm text-muted-foreground">Extract text from any image — printed, handwritten, Hindi, English & more</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Upload area */}
                    <div className="space-y-4">
                        <Card
                            className={`p-6 glassmorphism border-2 border-dashed transition-all cursor-pointer ${dragging ? "border-saffron-500 bg-saffron-500/5" : "border-border/50 hover:border-saffron-500/50"}`}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                        >
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Uploaded" className="w-full max-h-[350px] object-contain rounded-lg" />
                                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7"
                                        onClick={e => { e.stopPropagation(); setImagePreview(null); setImageBase64(""); setResult(""); }}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="font-medium mb-1">Drop image here or click to upload</p>
                                    <p className="text-sm text-muted-foreground">PNG, JPG, WEBP, GIF supported</p>
                                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                                        {["Printed text", "Handwriting", "Hindi/Devanagari", "Screenshots", "Bills & Receipts"].map(t => (
                                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Button
                            onClick={() => ocrMutation.mutate()}
                            disabled={!imageBase64 || ocrMutation.isPending}
                            className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-700 hover:opacity-90 font-semibold"
                        >
                            {ocrMutation.isPending ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Extracting text...</> : <><ScanText className="h-5 w-5 mr-2" />Extract Text</>}
                        </Button>

                        {/* Tips */}
                        <Card className="p-4 glassmorphism border-0">
                            <p className="text-xs font-semibold text-saffron-500 mb-2">💡 Tips for best results</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Use clear, well-lit photos</li>
                                <li>Ensure text is in focus and readable</li>
                                <li>Works with Hindi, English, and mixed text</li>
                                <li>Supports receipts, documents, books, whiteboards</li>
                            </ul>
                        </Card>
                    </div>

                    {/* Result */}
                    <Card className="p-5 glassmorphism border-0 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ScanText className="h-4 w-4 text-violet-500" /> Extracted Text
                            </h3>
                            {result && (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={copyText} className="h-7 gap-1 text-xs">
                                        {copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        {copied ? "Copied!" : "Copy"}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={downloadText} className="h-7 gap-1 text-xs">
                                        <Download className="h-3 w-3" /> Download
                                    </Button>
                                </div>
                            )}
                        </div>
                        {ocrMutation.isPending ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 rounded-full tricolor-gradient-animated flex items-center justify-center">
                                    <ScanText className="h-7 w-7 text-white animate-pulse" />
                                </div>
                                <p className="text-muted-foreground text-sm">Scanning image for text...</p>
                            </div>
                        ) : result ? (
                            <div className="flex-1 overflow-auto">
                                <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-xl leading-relaxed h-full">{result}</pre>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                                <ImageIcon className="h-14 w-14 mb-3 opacity-20" />
                                <p>Upload an image and click Extract Text</p>
                                <p className="text-xs mt-1">AI will identify and extract all text</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
