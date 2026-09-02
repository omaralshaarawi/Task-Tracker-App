import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  GetDashboardSummaryResponse,
  GetTaskParams,
  GetTaskResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseIdParam(raw: string | string[]): number {
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

router.get("/tasks", async (req, res): Promise<void> => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task filters");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, priority, search } = parsed.data;
  const filters = [
    status ? eq(tasksTable.status, status) : undefined,
    priority ? eq(tasksTable.priority, priority) : undefined,
    search
      ? or(
          ilike(tasksTable.title, `%${search}%`),
          ilike(tasksTable.description, `%${search}%`),
        )
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(tasksTable.updatedAt));

  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dueDate, ...data } = parsed.data;
  const [task] = await db
    .insert(tasksTable)
    .values({
      ...data,
      dueDate: dueDate == null ? null : toDateOnly(dueDate),
    })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(task));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse({
    id: parseIdParam(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.id));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse({
    id: parseIdParam(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid task update");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { dueDate, ...data } = parsed.data;
  const update = {
    ...data,
    ...(Object.prototype.hasOwnProperty.call(parsed.data, "dueDate")
      ? { dueDate: dueDate == null ? null : toDateOnly(dueDate) }
      : {}),
    updatedAt: new Date(),
  };

  const [task] = await db
    .update(tasksTable)
    .set(update)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse({
    id: parseIdParam(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .orderBy(desc(tasksTable.updatedAt));

  const today = new Date().toISOString().slice(0, 10);
  const activeTasks = tasks.filter((task) => task.status !== "done");
  const summary = {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length,
    dueToday: activeTasks.filter((task) => task.dueDate === today).length,
    overdue: activeTasks.filter(
      (task) => task.dueDate !== null && task.dueDate < today,
    ).length,
    recentTasks: tasks.slice(0, 5),
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;