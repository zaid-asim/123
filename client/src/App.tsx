import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SettingsProvider } from "@/lib/settings-context";
import { MusicProvider } from "@/lib/music-context";
import { TTSProvider } from "@/lib/tts-context";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import Music from "@/pages/music";
import Productivity from "@/pages/productivity";
import Search from "@/pages/search";
import SwadeshDaily from "@/pages/daily";
import DocumentMaster from "@/pages/tools/document";
import CodeLab from "@/pages/tools/code";
import StudyPro from "@/pages/tools/study";
import LanguageConverter from "@/pages/tools/language";
import VoiceOperations from "@/pages/tools/voice";
import ImageVision from "@/pages/tools/image";
import CreativeTools from "@/pages/tools/creative";
import Landing from "@/pages/landing";
import Setup from "@/pages/setup";
import MemoryPage from "@/pages/memory";
import type { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-saffron-500" />
        <p className="text-muted-foreground">Loading Swadesh AI...</p>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  const typedUser = user as User | undefined;
  if (typedUser && !typedUser.setupCompleted) {
    return (
      <Switch>
        <Route path="/" component={Setup} />
        <Route component={Setup} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/settings" component={Settings} />
      <Route path="/music" component={Music} />
      <Route path="/productivity" component={Productivity} />
      <Route path="/search" component={Search} />
      <Route path="/daily" component={SwadeshDaily} />
      <Route path="/tools/document" component={DocumentMaster} />
      <Route path="/tools/code" component={CodeLab} />
      <Route path="/tools/study" component={StudyPro} />
      <Route path="/tools/language" component={LanguageConverter} />
      <Route path="/tools/voice" component={VoiceOperations} />
      <Route path="/tools/image" component={ImageVision} />
      <Route path="/tools/creative" component={CreativeTools} />
      <Route path="/memory" component={MemoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <SettingsProvider>
          <MusicProvider>
            <TTSProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </TTSProvider>
          </MusicProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
