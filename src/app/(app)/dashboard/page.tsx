import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TodoBoard } from "./todo-board";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [todos, users] = await Promise.all([
    prisma.todoItem.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Att göra</h1>
        <p className="text-muted-foreground">
          Uppgifter för student och handledare
        </p>
      </div>
      <TodoBoard
        initialTodos={JSON.parse(JSON.stringify(todos))}
        users={users}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
