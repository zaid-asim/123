import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Brain, Loader2,
  Search, Download, Pin, PinOff, CheckSquare, Square, Filter
} from "lucide-react";
import { ParticleBackground } from "@/components/particle-background";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Memory } from "@shared/schema";
import { memoryCategories, type MemoryCategory } from "@shared/schema";

const categoryColors: Record<string, string> = {
  general: "bg-gray-500/20 text-gray-600 dark:text-gray-300",
  personal: "bg-pink-500/20 text-pink-600 dark:text-pink-300",
  work: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  health: "bg-green-500/20 text-green-600 dark:text-green-300",
  learning: "bg-purple-500/20 text-purple-600 dark:text-purple-300",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  personal: "Personal",
  work: "Work",
  health: "Health",
  learning: "Learning",
};

export default function MemoryPage() {
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("general");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: memories = [], isLoading } = useQuery<Memory[]>({ queryKey: ["/api/memories"] });

  const filtered = useMemo(() => {
    let result = memories;
    if (activeCategory !== "all") result = result.filter(m => m.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.content.toLowerCase().includes(q));
    }
    return result;
  }, [memories, activeCategory, searchQuery]);

  const createMutation = useMutation({
    mutationFn: async (data: { content: string; category: string }) => {
      return await apiRequest("POST", "/api/memories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      setNewMemory(""); setShowAddForm(false);
      toast({ title: "Memory added!" });
    },
    onError: () => toast({ title: "Failed to add memory", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return await apiRequest("PATCH", `/api/memories/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      setEditingId(null);
      toast({ title: "Memory updated!" });
    },
    onError: () => toast({ title: "Failed to update memory", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/memories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({ title: "Memory deleted" });
    },
    onError: () => toast({ title: "Failed to delete memory", variant: "destructive" }),
  });

  const handleAddMemory = () => {
    if (newMemory.trim()) createMutation.mutate({ content: newMemory.trim(), category: newCategory });
  };

  const startEditing = (memory: Memory) => { setEditingId(memory.id); setEditContent(memory.content); };
  const cancelEditing = () => { setEditingId(null); setEditContent(""); };
  const saveEdit = () => { if (editingId && editContent.trim()) updateMutation.mutate({ id: editingId, content: editContent.trim() }); };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedIds)) await apiRequest("DELETE", `/api/memories/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
    setSelectedIds(new Set()); setBulkMode(false);
    toast({ title: `Deleted ${selectedIds.size} memories` });
  };

  const handleExport = () => {
    const text = memories.map(m =>
      `[${m.category?.toUpperCase()}] ${m.content}\n(Added: ${new Date(m.createdAt!).toLocaleDateString()})`
    ).join("\n\n---\n\n");
    const blob = new Blob([`SWADESH AI MEMORIES\nExported: ${new Date().toLocaleString()}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "swadesh-memories.txt"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Memories exported!" });
  };

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

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gradient-tricolor flex items-center gap-2">
            <Brain className="h-7 w-7 text-saffron-500" />
            Memory Manager
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={memories.length === 0} className="gap-1 h-8">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button
              variant={bulkMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
              className="gap-1 h-8"
            >
              {bulkMode ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><CheckSquare className="h-3.5 w-3.5" /> Select</>}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">Manage what Swadesh AI remembers about you</p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="pl-9 bg-background/50"
            data-testid="input-search-memories"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className="h-7 text-xs"
          >All ({memories.length})</Button>
          {memoryCategories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="h-7 text-xs capitalize"
            >
              {categoryLabels[cat]} ({memories.filter(m => m.category === cat).length})
            </Button>
          ))}
        </div>

        {/* Bulk delete bar */}
        {bulkMode && selectedIds.size > 0 && (
          <Card className="p-3 mb-4 glassmorphism border-saffron-500/30 flex items-center justify-between">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="gap-1 h-7">
              <Trash2 className="h-3.5 w-3.5" /> Delete Selected
            </Button>
          </Card>
        )}

        <Card className="glassmorphism border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Your Memories</CardTitle>
              <CardDescription>These personalize your AI experience</CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} className="gap-2" disabled={showAddForm} data-testid="button-add-new-memory">
              <Plus className="h-4 w-4" /> Add Memory
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddForm && (
              <Card className="border-saffron-500/30 bg-saffron-500/5">
                <CardContent className="p-4 space-y-3">
                  <Textarea
                    value={newMemory}
                    onChange={e => setNewMemory(e.target.value)}
                    placeholder="Enter something for me to remember about you..."
                    className="min-h-[100px]"
                    data-testid="input-new-memory"
                  />
                  <div className="flex items-center gap-3">
                    <Select value={newCategory} onValueChange={(v) => setNewCategory(v as MemoryCategory)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {memoryCategories.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs capitalize">{categoryLabels[cat]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end gap-2 flex-1">
                      <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewMemory(""); }}>Cancel</Button>
                      <Button onClick={handleAddMemory} disabled={!newMemory.trim() || createMutation.isPending} className="gap-2" data-testid="button-save-new-memory">
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-saffron-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                {searchQuery || activeCategory !== "all"
                  ? <p>No memories match your filter</p>
                  : <p>No memories yet. Add some to personalize your experience!</p>
                }
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((memory) => (
                  <Card key={memory.id} className={`border-muted-foreground/20 transition-all ${selectedIds.has(memory.id) ? "ring-2 ring-saffron-500" : ""}`}>
                    <CardContent className="p-4">
                      {editingId === memory.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="min-h-[80px]"
                            data-testid={`input-edit-memory-${memory.id}`}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={cancelEditing}><X className="h-4 w-4" /></Button>
                            <Button size="sm" onClick={saveEdit} disabled={!editContent.trim() || updateMutation.isPending}>
                              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          {bulkMode && (
                            <button onClick={() => toggleSelect(memory.id)} className="mt-0.5 shrink-0">
                              {selectedIds.has(memory.id)
                                ? <CheckSquare className="h-4 w-4 text-saffron-500" />
                                : <Square className="h-4 w-4 text-muted-foreground" />}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge className={`text-xs border-0 ${categoryColors[memory.category || "general"]}`}>
                                {categoryLabels[memory.category || "general"]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(memory.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <p className="text-sm">{memory.content}</p>
                          </div>
                          {!bulkMode && (
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" onClick={() => startEditing(memory)} data-testid={`button-edit-memory-${memory.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(memory.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-memory-${memory.id}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
