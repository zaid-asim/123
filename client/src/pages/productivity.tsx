import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Check, Trash2, StickyNote, ListTodo, Bell, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwadeshLogo } from "@/components/swadesh-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ParticleBackground } from "@/components/particle-background";
import type { TodoItem, Note } from "@shared/schema";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

const NOTE_TEMPLATES = [
  {
    name: "Sanskrit Grammar Study",
    title: "Sanskrit Grammar Notes",
    content: "Topic: Sandhi / Vibhakti / Dhatu\n\nNotes:\n- Rules: \n- Examples: \n- Pronunciation Tips: "
  },
  {
    name: "Daily Reflection Log",
    title: "Daily Log - " + new Date().toLocaleDateString("en-IN"),
    content: "Today's Focus:\n-\n\nThings learned:\n-\n\nWhat went well:\n-\n\nThoughts for tomorrow:\n-"
  },
  {
    name: "AI Coding Assistant Plan",
    title: "Coding Strategy: ",
    content: "Goal: \n\nImplementation Steps:\n1. Define schema & types\n2. Refactor helper functions\n3. Build UI screens\n4. Write tests & verify"
  }
];

const TODO_PRESETS = [
  {
    name: "Vedic Sanskrit Daily",
    items: [
      { text: "Recite Shlokas (15 mins)", priority: "low" as const },
      { text: "Learn 5 new Sanskrit nouns", priority: "medium" as const },
      { text: "Practice Devanagari writing", priority: "low" as const },
      { text: "Read grammar rule summary", priority: "high" as const }
    ]
  },
  {
    name: "Software Developer Block",
    items: [
      { text: "Fix typescript compiler warnings", priority: "high" as const },
      { text: "Implement mock test suite", priority: "medium" as const },
      { text: "Refactor backend API routing", priority: "high" as const },
      { text: "Write documentation walkthrough", priority: "low" as const }
    ]
  }
];

const TODOS_KEY = "swadesh-todos";
const NOTES_KEY = "swadesh-notes";
const REMINDERS_KEY = "swadesh-reminders";

type Reminder = {
  id: string;
  title: string;
  time: string;
  triggered: boolean;
};

type Priority = "low" | "medium" | "high";

interface ExtTodoItem extends TodoItem {
  priority: Priority;
}

const priorityColors: Record<Priority, string> = {
  low: "bg-green-500/20 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  high: "bg-red-500/20 text-red-600 dark:text-red-400",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

export default function Productivity() {
  const [, navigate] = useLocation();
  const [todos, setTodos] = useState<ExtTodoItem[]>(() => loadFromStorage(TODOS_KEY, []));
  const [notes, setNotes] = useState<Note[]>(() => loadFromStorage(NOTES_KEY, []));
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState("");

  const [reminders, setReminders] = useState<Reminder[]>(() => loadFromStorage(REMINDERS_KEY, []));
  const [newReminder, setNewReminder] = useState({ title: "", time: "" });
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Persist on change
  useEffect(() => { localStorage.setItem(TODOS_KEY, JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders)); }, [reminders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowString = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      setReminders(prev => {
        let changed = false;
        const next = prev.map(r => {
          if (!r.triggered && r.time === nowString) {
            changed = true;
            if (Notification.permission === "granted") {
              new Notification("Swadesh AI Reminder", { body: r.title, icon: "/favicon.ico" });
            }
            return { ...r, triggered: true };
          }
          return r;
        });
        return changed ? next : prev;
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const addReminder = () => {
    if (!newReminder.title.trim() || !newReminder.time) return;
    const rem: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title.trim(),
      time: newReminder.time,
      triggered: false
    };
    setReminders([...reminders, rem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewReminder({ title: "", time: "" });
  };

  const deleteReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: ExtTodoItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false,
      createdAt: Date.now(),
      priority: newPriority,
    };
    setTodos([todo, ...todos]);
    setNewTodo("");
    setNewPriority("medium");
  };

  const toggleTodo = (id: string) => setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: string) => setTodos(todos.filter(t => t.id !== id));
  const clearCompleted = () => setTodos(todos.filter(t => !t.completed));

  const addNote = () => {
    if (!newNote.title.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title.trim(),
      content: newNote.content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([note, ...notes]);
    setNewNote({ title: "", content: "" });
  };

  const updateNote = (id: string, content: string) =>
    setNotes(notes.map(n => n.id === id ? { ...n, content, updatedAt: Date.now() } : n));

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (editingNote === id) setEditingNote(null);
  };

  const filteredNotes = noteSearch
    ? notes.filter(n => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase()))
    : notes;

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleBackground />
      <PageHeader title="Productivity Suite" />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl relative z-10">
        <h1 className="text-3xl font-bold mb-8 text-gradient-tricolor">Productivity Suite</h1>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="todos" className="gap-2" data-testid="tab-todos">
              <ListTodo className="w-4 h-4" />
              To-Do {todos.length > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-1">{todos.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2" data-testid="tab-notes">
              <StickyNote className="w-4 h-4" />
              Notes {notes.length > 0 && <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-1">{notes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2" data-testid="tab-reminders">
              <Bell className="w-4 h-4" />
              Reminders
            </TabsTrigger>
          </TabsList>

          {/* TODOS */}
          <TabsContent value="todos" className="space-y-4">
            <Card className="p-4 glassmorphism border-0">
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  placeholder="Add a new task..."
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  className="flex-1"
                  data-testid="input-new-todo"
                />
                <Select value={newPriority} onValueChange={v => setNewPriority(v as Priority)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addTodo} className="bg-saffron-500 hover:bg-saffron-600" data-testid="button-add-todo">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs">
                <span className="text-muted-foreground font-medium">Quick Presets:</span>
                <div className="flex gap-2">
                  {TODO_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => {
                        const newTodos = preset.items.map(item => ({
                          id: (Date.now() + Math.random()).toString(),
                          text: item.text,
                          completed: false,
                          createdAt: Date.now(),
                          priority: item.priority
                        }));
                        setTodos(prev => [...newTodos, ...prev]);
                      }}
                    >
                      + {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {completedCount > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">{completedCount} completed</span>
                <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-xs h-7 text-muted-foreground hover:text-destructive">
                  Clear completed
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {todos.length === 0 ? (
                <Card className="p-8 glassmorphism border-0 text-center">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No tasks yet. Add your first task above!</p>
                </Card>
              ) : (
                todos.map((todo, index) => (
                  <Card
                    key={todo.id}
                    className={cn("p-4 glassmorphism border-0 flex items-center gap-3 animate-slide-up", todo.completed && "opacity-60")}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      data-testid={`checkbox-todo-${todo.id}`}
                    />
                    <span className={cn("flex-1 text-sm", todo.completed && "line-through")}>{todo.text}</span>
                    <Badge className={`text-xs border-0 capitalize ${priorityColors[todo.priority || "medium"]}`}>
                      {todo.priority || "medium"}
                    </Badge>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                      data-testid={`button-delete-todo-${todo.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="space-y-4">
            <Card className="p-4 glassmorphism border-0 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">Choose Template:</span>
                <Select
                  onValueChange={v => {
                    const template = NOTE_TEMPLATES.find(t => t.name === v);
                    if (template) {
                      setNewNote({ title: template.title, content: template.content });
                    }
                  }}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TEMPLATES.map(t => (
                      <SelectItem key={t.name} value={t.name} className="text-xs">{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={newNote.title}
                onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Note title..."
                data-testid="input-note-title"
              />
              <Textarea
                value={newNote.content}
                onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Write your note..."
                rows={3}
                data-testid="input-note-content"
              />
              <Button onClick={addNote} className="w-full bg-india-green-500 hover:bg-india-green-600" data-testid="button-add-note">
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </Button>
            </Card>

            {notes.length > 0 && (
              <Input
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
                placeholder="Search notes..."
                className="bg-background/50"
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {filteredNotes.length === 0 ? (
                <Card className="p-8 glassmorphism border-0 text-center md:col-span-2">
                  <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">{noteSearch ? "No notes match your search" : "No notes yet. Create your first note!"}</p>
                </Card>
              ) : (
                filteredNotes.map((note, index) => (
                  <Card key={note.id} className="p-4 glassmorphism border-0 animate-slide-up" style={{ animationDelay: `${index * 0.04}s` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm">{note.title}</h3>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => deleteNote(note.id)}
                        className="text-destructive hover:text-destructive h-7 w-7 shrink-0"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {editingNote === note.id ? (
                      <Textarea
                        value={note.content}
                        onChange={e => updateNote(note.id, e.target.value)}
                        onBlur={() => setEditingNote(null)}
                        autoFocus rows={4}
                      />
                    ) : (
                      <p
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors line-clamp-4"
                        onClick={() => setEditingNote(note.id)}
                      >
                        {note.content || "Click to edit..."}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(note.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* REMINDERS */}
          <TabsContent value="reminders" className="space-y-4">
            <Card className="p-4 glassmorphism border-0 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Browser Notifications</h3>
                <p className="text-xs text-muted-foreground">Required to receive alerts when app is in background</p>
              </div>
              {notificationPermission === "granted" ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Enabled</Badge>
              ) : (
                <Button size="sm" onClick={requestNotificationPermission} variant="outline" className="text-xs">
                  Enable Notifications
                </Button>
              )}
            </Card>

            <Card className="p-4 glassmorphism border-0 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newReminder.title}
                  onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="Remind me to..."
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={newReminder.time}
                  onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="w-32"
                />
              </div>
              <Button onClick={addReminder} className="w-full bg-india-blue-500 hover:bg-india-blue-600">
                <Bell className="w-4 h-4 mr-2" /> Set Reminder
              </Button>
            </Card>

            <div className="space-y-2 mt-4">
              {reminders.length === 0 ? (
                <Card className="p-8 glassmorphism border-0 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-india-blue-500 opacity-50" />
                  <p className="text-muted-foreground">No reminders set</p>
                </Card>
              ) : (
                reminders.map(rem => (
                  <Card key={rem.id} className={cn("p-4 glassmorphism border-0 flex items-center justify-between", rem.triggered && "opacity-60")}>
                    <div>
                      <h3 className={cn("font-medium", rem.triggered && "line-through text-muted-foreground")}>{rem.title}</h3>
                      <p className="text-xs text-muted-foreground">{rem.time}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(rem.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
