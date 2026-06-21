import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Languages, Loader2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ParticleBackground } from "@/components/particle-background";
import { apiRequest } from "@/lib/queryClient";
import { ToolActionFooter } from "@/components/tool-action-footer";

const languages = [
  { value: "en", label: "English", flag: "EN" },
  { value: "hi", label: "Hindi (हिन्दी)", flag: "HI" },
  { value: "ta", label: "Tamil (தமிழ்)", flag: "TA" },
  { value: "te", label: "Telugu (తెలుగు)", flag: "TE" },
  { value: "bn", label: "Bengali (বাংলা)", flag: "BN" },
  { value: "mr", label: "Marathi (मराठी)", flag: "MR" },
  { value: "gu", label: "Gujarati (ગુજરાતી)", flag: "GU" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)", flag: "KN" },
  { value: "ml", label: "Malayalam (മലയാളം)", flag: "ML" },
  { value: "pa", label: "Punjabi (ਪੰਜਾਬੀ)", flag: "PA" },
  { value: "or", label: "Odia (ଓଡ଼ିଆ)", flag: "OR" },
  { value: "as", label: "Assamese (অসমীয়া)", flag: "AS" },
  { value: "ur", label: "Urdu (اردو)", flag: "UR" },
  { value: "ne", label: "Nepali (नेपाली)", flag: "NE" },
  { value: "sa", label: "Sanskrit (संस्कृत)", flag: "SA" },
  { value: "kok", label: "Konkani (कोंकणी)", flag: "KOK" },
];

export default function LanguageConverter() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const initialQuery = new URLSearchParams(searchString).get("q") || "";
  const [text, setText] = useState(initialQuery);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [transliterate, setTransliterate] = useState(false);
  const [result, setResult] = useState("");

  const translateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/tools/language", {
        text,
        sourceLanguage,
        targetLanguage,
        transliterate,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
    },
  });

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    if (result) {
      setText(result);
      setResult("");
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      
      <PageHeader title="Language Converter" />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
            <Languages className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-tricolor">Language Converter</h1>
            <p className="text-muted-foreground">Translate between Indian languages</p>
          </div>
        </div>

        <Card className="p-6 glassmorphism border-0 mb-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="w-40" data-testid="select-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="font-medium mr-2">{lang.flag}</span>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={swapLanguages}
              className="rounded-full"
              data-testid="button-swap"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>

            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-40" data-testid="select-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="font-medium mr-2">{lang.flag}</span>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Switch
              id="transliterate"
              checked={transliterate}
              onCheckedChange={setTransliterate}
              data-testid="switch-transliterate"
            />
            <Label htmlFor="transliterate">Include Roman transliteration</Label>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 glassmorphism border-0">
            <h2 className="font-semibold mb-4">
              {languages.find(l => l.value === sourceLanguage)?.label}
            </h2>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate..."
              rows={8}
              className="mb-4"
              data-testid="input-text"
            />
            <Button
              onClick={() => translateMutation.mutate()}
              disabled={!text.trim() || translateMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-saffron-500 hover:from-purple-600 hover:to-saffron-600"
              data-testid="button-translate"
            >
              {translateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="w-4 h-4 mr-2" />
                  Translate
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 glassmorphism border-0 flex flex-col justify-between">
            <h2 className="font-semibold mb-4">
              {languages.find(l => l.value === targetLanguage)?.label}
            </h2>
            {result ? (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none text-xl leading-relaxed whitespace-pre-wrap flex-grow">
                  {result}
                </div>
                <ToolActionFooter content={result} title={`Translation to ${languages.find(l => l.value === targetLanguage)?.label}`} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Languages className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Translation will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
