import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Brain, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Memory } from "@shared/schema";

export default function MemoryPage() {
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: memories = [], isLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/memories", { content, category: "general" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      setNewMemory("");
      setShowAddForm(false);
      toast({ title: "Memory added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add memory", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return await apiRequest("PATCH", `/api/memories/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      setEditingId(null);
      toast({ title: "Memory updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update memory", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/memories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({ title: "Memory deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete memory", variant: "destructive" });
    },
  });

  const startEditing = (memory: Memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      updateMutation.mutate({ id: editingId, content: editContent.trim() });
    }
  };

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      createMutation.mutate(newMemory.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-saffron-500" />
              Memory Manager
            </h1>
            <p className="text-muted-foreground">
              Manage what Swadesh AI remembers about you
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Your Memories</CardTitle>
              <CardDescription>
                These help personalize your AI experience
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="gap-2"
              disabled={showAddForm}
              data-testid="button-add-new-memory"
            >
              <Plus className="h-4 w-4" />
              Add Memory
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showAddForm && (
              <Card className="border-saffron-500/30 bg-saffron-500/5">
                <CardContent className="p-4 space-y-3">
                  <Textarea
                    value={newMemory}
                    onChange={(e) => setNewMemory(e.target.value)}
                    placeholder="Enter something for me to remember about you..."
                    className="min-h-[100px]"
                    data-testid="input-new-memory"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewMemory("");
                      }}
                      data-testid="button-cancel-add"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMemory}
                      disabled={!newMemory.trim() || createMutation.isPending}
                      className="gap-2"
                      data-testid="button-save-new-memory"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-saffron-500" />
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No memories yet. Add some to personalize your experience!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <Card key={memory.id} className="border-muted-foreground/20">
                    <CardContent className="p-4">
                      {editingId === memory.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px]"
                            data-testid={`input-edit-memory-${memory.id}`}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              data-testid={`button-cancel-edit-${memory.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={!editContent.trim() || updateMutation.isPending}
                              data-testid={`button-save-edit-${memory.id}`}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <p className="flex-1 text-sm">{memory.content}</p>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(memory)}
                              data-testid={`button-edit-memory-${memory.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(memory.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-memory-${memory.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
