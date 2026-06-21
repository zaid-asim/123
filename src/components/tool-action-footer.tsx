import { MessageSquare, Save, Languages, Copy, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTTS } from "@/lib/tts-context";
import { useState } from "react";
import type { Note } from "@shared/schema";

interface ToolActionFooterProps {
  content: string;
  title?: string;
  className?: string;
}

export function ToolActionFooter({ content, title = "Tool Result", className = "" }: ToolActionFooterProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { speak, stop, isSpeaking } = useTTS();
  const [copied, setCopied] = useState(false);

  const handleDiscuss = () => {
    navigate(`/chat?q=${encodeURIComponent(`I am looking at this:\n\n${content}\n\nCan you explain more about it?`)}`);
  };

  const handleSaveToNotes = () => {
    try {
      const storedNotes = localStorage.getItem("swadesh-notes");
      const notes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];
      const newNote: Note = {
        id: Date.now().toString(),
        title: title,
        content: content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem("swadesh-notes", JSON.stringify([newNote, ...notes]));
      toast({ title: "Saved to Notes successfully!" });
    } catch (e) {
      toast({ title: "Failed to save note", variant: "destructive" });
    }
  };

  const handleTranslate = () => {
    navigate(`/tools/language?q=${encodeURIComponent(content)}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const handleSpeak = () => {
    isSpeaking ? stop() : speak(content);
  };

  return (
    <div className={`mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2 ${className}`}>
      <Button variant="ghost" size="sm" onClick={handleDiscuss} className="h-8 text-xs gap-1 hover:text-saffron-500">
        <MessageSquare className="w-3.5 h-3.5" />
        Discuss
      </Button>
      <Button variant="ghost" size="sm" onClick={handleSaveToNotes} className="h-8 text-xs gap-1 hover:text-india-green-500">
        <Save className="w-3.5 h-3.5" />
        Save to Notes
      </Button>
      <Button variant="ghost" size="sm" onClick={handleTranslate} className="h-8 text-xs gap-1 hover:text-india-blue-500">
        <Languages className="w-3.5 h-3.5" />
        Translate
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={handleSpeak} className="h-8 w-8 p-0">
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
        {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}
