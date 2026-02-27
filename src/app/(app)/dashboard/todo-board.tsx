"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface UserInfo {
  id: string;
  name: string;
  role: string;
}

interface TodoItemData {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  assignee: UserInfo;
  createdBy: UserInfo;
}

interface TodoBoardProps {
  initialTodos: TodoItemData[];
  users: UserInfo[];
  currentUserId: string;
}

type FilterMode = "all" | "mine" | "done";

function SortableTodoItem({
  todo,
  currentUserId,
  onToggle,
  onDelete,
  onTitleSave,
}: {
  todo: TodoItemData;
  currentUserId: string;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onTitleSave: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleTitleBlur() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      onTitleSave(todo.id, trimmed);
    } else {
      setEditTitle(todo.title);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setEditTitle(todo.title);
      setEditing(false);
    }
  }

  const isMine = todo.assignee.id === currentUserId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card p-3 ${
        todo.completed ? "opacity-60" : ""
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          todo.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        {todo.completed && <Check className="h-3 w-3" />}
      </button>

      {editing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          className="h-7 flex-1"
          autoFocus
          maxLength={500}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 cursor-text text-sm ${
            todo.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.title}
        </span>
      )}

      <Badge
        variant={isMine ? "default" : "secondary"}
        className="shrink-0 text-xs"
      >
        {todo.assignee.name}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(todo.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function TodoBoard({ initialTodos, users, currentUserId }: TodoBoardProps) {
  const [todos, setTodos] = useState<TodoItemData[]>(initialTodos);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState(currentUserId);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTodos = todos.filter((t) => {
    if (filter === "mine") return t.assignee.id === currentUserId;
    if (filter === "done") return t.completed;
    return true;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || adding) return;

    setAdding(true);
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, assigneeId: newAssignee }),
    });

    if (response.ok) {
      const todo = await response.json();
      setTodos((prev) => [...prev, todo]);
      setNewTitle("");
    }
    setAdding(false);
  }

  async function handleToggle(id: string, completed: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );

    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  async function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  async function handleTitleSave(id: string, title: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );

    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    setTodos(reordered);

    await fetch("/api/todos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map((t, i) => ({ id: t.id, sortOrder: i })),
      }),
    });
  }

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="space-y-4">
      {/* Add form */}
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ny uppgift..."
              className="flex-1"
              maxLength={500}
            />
            <Select value={newAssignee} onValueChange={setNewAssignee}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role === "owner" ? "Student" : "Handledare"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              disabled={!newTitle.trim() || adding}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Lägg till
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter + progress */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["all", "mine", "done"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Alla" : f === "mine" ? "Mina" : "Klara"}
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {doneCount}/{todos.length} klara
        </span>
      </div>

      {/* Sortable list */}
      {filteredTodos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Inga uppgifter ännu. Lägg till en ovan!"
                : filter === "mine"
                  ? "Du har inga tilldelade uppgifter."
                  : "Inga klara uppgifter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTodos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  currentUserId={currentUserId}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onTitleSave={handleTitleSave}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
