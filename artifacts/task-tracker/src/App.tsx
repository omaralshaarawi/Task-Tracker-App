import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Clock3,
  Command,
  Flag,
  LayoutDashboard,
  ListFilter,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetTaskQueryKey,
  getListTasksQueryKey,
  useCreateTask,
  useDeleteTask,
  useGetDashboardSummary,
  useGetTask,
  useHealthCheck,
  useListTasks,
  useUpdateTask,
} from '@workspace/api-client-react';
import type {
  DashboardSummary,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();
const statuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
const priorities: TaskPriority[] = ['low', 'medium', 'high'];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatDate(date: string | null) {
  if (!date) return 'No due date';
  const calendarDate = date.slice(0, 10);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${calendarDate}T12:00:00`));
}

function isOverdue(task: Task) {
  return task.status !== 'done' && !!task.dueDate && task.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function statusLabel(status: TaskStatus) {
  return status === 'in_progress' ? 'In progress' : status === 'todo' ? 'To do' : 'Done';
}

function priorityLabel(priority: TaskPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: health } = useHealthCheck();
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/tasks', label: 'All tasks', icon: CheckCircle2 },
    { href: '/settings', label: 'Preferences', icon: SettingsIcon },
  ];

  return (
    <div className="app-noise min-h-[100dvh] bg-background text-foreground">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform duration-300 md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center gap-3 px-3">
          <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[0_5px_0_hsl(43_88%_42%)]">
            <Zap size={18} strokeWidth={2.7} />
          </div>
          <div>
            <p className="font-sans text-[15px] font-extrabold tracking-[-0.03em] text-sidebar-foreground">Daymark</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sidebar-foreground/50">focus / forward</p>
          </div>
        </div>

        <div className="mt-12 px-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/40">Workspace</p>
          <nav className="mt-3 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-${label.toLowerCase().replace(' ', '-')}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200',
                  location === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                )}
              >
                <Icon size={16} strokeWidth={location === href ? 2.5 : 2} />
                <span>{label}</span>
                {location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-3">
          <div className="mb-4 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3.5">
            <div className="flex items-center gap-2 text-primary">
              <Activity size={13} />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em]">System {health?.status === 'ok' ? 'ready' : 'online'}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/45">A small plan beats a loud mind.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border px-1 pt-4">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[hsl(168_35%_45%)] text-[11px] font-bold text-[hsl(42_38%_98%)]">AM</div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-sidebar-foreground">Alex Morgan</p>
              <p className="truncate text-[10px] text-sidebar-foreground/45">Personal workspace</p>
            </div>
            <button type="button" data-testid="button-profile-menu" className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </aside>

      {mobileOpen && <button type="button" data-testid="button-close-mobile-nav" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[hsl(211_34%_18%/.35)] md:hidden" />}
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button type="button" data-testid="button-open-mobile-nav" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={19} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(168_35%_45%)]" />
            <span>{dateLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/tasks" data-testid="link-header-tasks" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:flex">
              <Command size={14} /> Quick find <kbd className="ml-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">K</kbd>
            </Link>
            <Link href="/tasks?new=1" data-testid="link-header-new-task" className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_hsl(43_88%_42%)]">
              <Plus size={15} strokeWidth={2.7} /> <span className="hidden sm:inline">New task</span><span className="sm:hidden">New</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-11">{children}</div>
      </main>
    </div>
  );
}

function LoadingBlock({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} />;
}

function ErrorMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div data-testid="status-error" className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive"><X size={19} /></div>
      <p className="mt-4 text-sm font-bold">Could not load this view</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">The workspace is taking a beat. Try again in a moment.</p>
      <button type="button" data-testid="button-retry" onClick={onRetry} className="mt-5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold transition hover:border-foreground/30 hover:bg-muted">Retry</button>
    </div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  const Icon = status === 'done' ? CheckCircle2 : status === 'in_progress' ? CircleDot : Circle;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold',
      status === 'done' ? 'bg-[hsl(168_35%_45%/.12)] text-[hsl(168_35%_34%)]' : status === 'in_progress' ? 'bg-[hsl(43_88%_56%/.18)] text-[hsl(33_70%_32%)]' : 'bg-muted text-muted-foreground',
    )}>
      <Icon size={11} /> {statusLabel(status)}
    </span>
  );
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  return <span className={cn('font-mono text-[10px] uppercase tracking-[0.08em]', priority === 'high' ? 'text-destructive' : priority === 'medium' ? 'text-[hsl(33_70%_40%)]' : 'text-muted-foreground')}>{priorityLabel(priority)}</span>;
}

function TaskRow({ task, onEdit, onDelete, onStatusChange }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onStatusChange: (task: Task, status: TaskStatus) => void }) {
  const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
  return (
    <div data-testid={`row-task-${task.id}`} className={cn('group grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border/70 px-4 py-4 transition-colors hover:bg-muted/45 md:grid-cols-[auto_1fr_120px_110px_auto] md:gap-4 md:px-5', task.status === 'done' && 'opacity-65')}>
      <button type="button" data-testid={`button-status-task-${task.id}`} aria-label={`Mark ${task.title} as ${statusLabel(nextStatus)}`} onClick={() => onStatusChange(task, nextStatus)} className={cn('grid h-5 w-5 place-items-center rounded-full border-2 transition-all duration-200 hover:scale-110', task.status === 'done' ? 'border-[hsl(168_35%_45%)] bg-[hsl(168_35%_45%)] text-white animate-check-pop' : task.status === 'in_progress' ? 'border-primary bg-primary/15' : 'border-border-foreground/30 group-hover:border-primary')}>
        {task.status === 'done' && <Check size={12} strokeWidth={3} />}
        {task.status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </button>
      <div className="min-w-0">
        <button type="button" data-testid={`button-edit-task-${task.id}`} onClick={() => onEdit(task)} className={cn('block max-w-full truncate text-left text-[13px] font-bold tracking-[-0.01em] transition-colors hover:text-[hsl(33_70%_40%)]', task.status === 'done' && 'line-through')}>{task.title}</button>
        <p className="mt-1 max-w-[520px] truncate text-[11px] text-muted-foreground">{task.description || 'No description added'}</p>
      </div>
      <div className="hidden md:block"><StatusPill status={task.status} /></div>
      <div className="hidden md:block"><PriorityTag priority={task.priority} /></div>
      <div className="col-start-3 row-start-1 flex items-center gap-2 md:col-auto md:row-auto">
        <span className={cn('hidden items-center gap-1 text-[10px] font-medium sm:flex', isOverdue(task) ? 'text-destructive' : 'text-muted-foreground')}><CalendarDays size={12} /> {formatDate(task.dueDate)}</span>
        <button type="button" data-testid={`button-delete-task-${task.id}`} onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`} className="rounded-lg p-2 text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function TaskModal({ open, task, onClose, onSaved }: { open: boolean; task: Task | null; onClose: () => void; onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const editId = task?.id ?? 0;
  const { data: fetchedTask } = useGetTask(editId, { query: { enabled: open && !!task, queryKey: getGetTaskQueryKey(editId) } });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const source = fetchedTask ?? task;
    if (open && source) {
      setTitle(source.title);
      setDescription(source.description ?? '');
      setStatus(source.status);
      setPriority(source.priority);
      setDueDate(source.dueDate?.slice(0, 10) ?? '');
    } else if (open && !task) {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
    }
    setError('');
  }, [open, task, fetchedTask]);

  if (!open) return null;
  const pending = createTask.isPending || updateTask.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError('Give this task a clear name first.'); return; }
    const data: TaskInput = { title: title.trim(), description: description.trim() || null, status, priority, dueDate: dueDate || null };
    const options = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        onClose();
        onSaved(task ? 'Task updated' : 'Task added to your plan');
      },
      onError: () => setError('That change did not save. Please try again.'),
    };
    if (task) updateTask.mutate({ id: task.id, data }, options);
    else createTask.mutate({ data }, options);
  };

  return (
    <div role="dialog" aria-modal="true" data-testid="dialog-task-form" className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(211_34%_18%/.48)] p-0 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div className="animate-rise-in w-full max-w-[560px] rounded-t-[24px] border border-border bg-card p-6 shadow-[0_18px_60px_hsl(211_34%_18%/.18)] sm:rounded-[24px] sm:p-8">
        <div className="flex items-start justify-between">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{task ? 'Refine task' : 'New task'}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">{task ? 'Make the next step obvious.' : 'Put it somewhere you can see it.'}</h2></div>
          <button type="button" data-testid="button-close-task-form" onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div><label htmlFor="task-title" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Task name</label><input id="task-title" data-testid="input-task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Send the revised proposal" className="mt-2 w-full border-0 border-b-2 border-border bg-transparent px-0 py-2 text-base font-bold outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary" /></div>
          <div><label htmlFor="task-description" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Context <span className="font-normal normal-case tracking-normal">(optional)</span></label><textarea id="task-description" data-testid="input-task-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does done look like?" className="mt-2 w-full resize-none rounded-xl border border-border bg-muted/50 p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary" /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label htmlFor="task-status" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Status</label><div className="relative mt-2"><select id="task-status" data-testid="select-task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full appearance-none rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary">{statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-muted-foreground" /></div></div>
            <div><label htmlFor="task-priority" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Priority</label><div className="relative mt-2"><select id="task-priority" data-testid="select-task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full appearance-none rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-xs font-bold outline-none focus:border-primary">{priorities.map((value) => <option key={value} value={value}>{priorityLabel(value)}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-muted-foreground" /></div></div>
            <div><label htmlFor="task-date" className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Due date</label><input id="task-date" type="date" data-testid="input-task-due-date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold outline-none focus:border-primary" /></div>
          </div>
          {error && <p data-testid="status-form-error" className="text-xs font-semibold text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-5"><button type="button" data-testid="button-cancel-task-form" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Cancel</button><button type="submit" data-testid="button-save-task" disabled={pending} className="rounded-xl bg-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{pending ? 'Saving…' : task ? 'Save changes' : 'Add task'}</button></div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ task, onClose, onDeleted }: { task: Task | null; onClose: () => void; onDeleted: (message: string) => void }) {
  const queryClient = useQueryClient();
  const deletion = useDeleteTask();
  if (!task) return null;
  const confirm = () => deletion.mutate({ id: task.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); onClose(); onDeleted('Task removed'); } });
  return <div role="dialog" aria-modal="true" data-testid="dialog-delete-task" className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(211_34%_18%/.48)] p-5 backdrop-blur-[2px]"><div className="animate-rise-in w-full max-w-[390px] rounded-[24px] border border-border bg-card p-7 shadow-[0_18px_60px_hsl(211_34%_18%/.18)]"><div className="grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 size={18} /></div><h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">Remove this task?</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground"><span className="font-bold text-foreground">“{task.title}”</span> will be removed from your plan. This cannot be undone.</p><div className="mt-7 flex justify-end gap-2"><button type="button" data-testid="button-cancel-delete" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Keep it</button><button type="button" data-testid="button-confirm-delete" disabled={deletion.isPending} onClick={confirm} className="rounded-xl bg-destructive px-4 py-2.5 text-xs font-extrabold text-destructive-foreground disabled:opacity-60">{deletion.isPending ? 'Removing…' : 'Remove task'}</button></div></div></div>;
}

function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return <div data-testid="status-notice" className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-xl border border-[hsl(168_35%_45%/.25)] bg-card px-4 py-3 text-xs font-bold shadow-[0_10px_30px_hsl(211_34%_18%/.12)]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(168_35%_45%)] text-white"><Check size={12} strokeWidth={3} /></span>{message}<button type="button" data-testid="button-dismiss-notice" onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground"><X size={14} /></button></div>;
}

function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetDashboardSummary();
  const [location, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [removeTask, setRemoveTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const summary = data as DashboardSummary | undefined;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  const completion = summary?.total ? Math.round((summary.done / summary.total) * 100) : 0;
  return (
    <>
      <section className="animate-rise-in flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{dateLabel}</p><h1 data-testid="text-dashboard-heading" className="mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[.98] tracking-[-0.065em]">{greeting}, Alex<span className="text-primary">.</span></h1><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">A clear day starts with a visible next step. Here’s the shape of yours.</p></div>
        <button type="button" data-testid="button-open-create-task" onClick={() => { setLocation('/'); setModalOpen(true); }} className="flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-extrabold transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_4px_0_hsl(43_88%_42%/.25)]"><Plus size={15} /> Add a task <ArrowRight size={14} className="ml-2 text-muted-foreground" /></button>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? [1, 2, 3, 4].map((i) => <LoadingBlock key={i} className="h-[138px]" />) : isError ? <div className="sm:col-span-2 xl:col-span-4"><ErrorMessage onRetry={() => refetch()} /></div> : <>
          <div data-testid="metric-total" className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-sidebar-foreground"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[14px] border-primary/20" /><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55">Total tasks</p><p className="mt-5 text-4xl font-extrabold tracking-[-0.07em]">{summary?.total ?? 0}</p><p className="mt-1 text-[11px] text-sidebar-foreground/55">in your workspace</p></div>
          <div data-testid="metric-in-progress" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">In motion</p><Clock3 size={16} className="text-primary" /></div><p className="mt-5 text-4xl font-extrabold tracking-[-0.07em]">{summary?.inProgress ?? 0}</p><p className="mt-1 text-[11px] text-muted-foreground">currently in progress</p></div>
          <div data-testid="metric-due-today" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Due today</p><CalendarDays size={16} className="text-[hsl(33_70%_40%)]" /></div><p className="mt-5 text-4xl font-extrabold tracking-[-0.07em]">{summary?.dueToday ?? 0}</p><p className="mt-1 text-[11px] text-muted-foreground">keep them close</p></div>
          <div data-testid="metric-completion" className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Momentum</p><Target size={16} className="text-[hsl(168_35%_45%)]" /></div><p className="mt-5 text-4xl font-extrabold tracking-[-0.07em]">{completion}<span className="text-lg text-muted-foreground">%</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[hsl(168_35%_45%)] transition-all duration-500" style={{ width: `${completion}%` }} /></div></div>
        </>}
      </div>

      {!isLoading && !isError && <div className="mt-10 grid gap-7 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Recent activity</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em]">Your latest moves</h2></div><Link href="/tasks" data-testid="link-view-all-tasks" className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition hover:text-foreground">View all <ArrowRight size={13} /></Link></div>
          {summary?.recentTasks?.length ? summary.recentTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} onEdit={setEditTask} onDelete={setRemoveTask} onStatusChange={(selected, next) => updateTask.mutate({ id: selected.id, data: { status: next } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setNotice(next === 'done' ? 'Nice. One less thing to carry.' : `Moved to ${statusLabel(next)}`); } })} />) : <div data-testid="empty-recent-tasks" className="flex flex-col items-center px-6 py-14 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"><Sparkles size={20} /></div><h3 className="mt-4 text-sm font-extrabold">A clean slate is a good start.</h3><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Add one meaningful task and make the day visible.</p><button type="button" data-testid="button-empty-add-task" onClick={() => setModalOpen(true)} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground">Add your first task</button></div>}
        </section>
        <section className="rounded-2xl border border-border bg-[hsl(43_88%_56%/.13)] p-6">
          <div className="flex items-center gap-2 text-[hsl(33_70%_40%)]"><Flag size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Daily cue</span></div>
          <p className="mt-12 text-[clamp(1.5rem,3vw,2.1rem)] font-extrabold leading-[1.05] tracking-[-0.06em] text-[hsl(211_34%_18%)]">Do the small thing that makes the big thing easier.</p>
          <div className="mt-10 flex items-end justify-between border-t border-[hsl(33_70%_40%/.2)] pt-4"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(33_70%_40%/.7)]">Overdue</span><span data-testid="metric-overdue" className="text-2xl font-extrabold tracking-[-0.05em] text-[hsl(211_34%_18%)]">{summary?.overdue ?? 0}</span></div>
        </section>
      </div>}
      <TaskModal open={modalOpen || !!editTask} task={editTask} onClose={() => { setModalOpen(false); setEditTask(null); }} onSaved={(message) => { setNotice(message); setModalOpen(false); setEditTask(null); }} />
      <DeleteModal task={removeTask} onClose={() => setRemoveTask(null)} onDeleted={setNotice} />
      {notice && <Notice message={notice} onClose={() => setNotice('')} />}
    </>
  );
}

function TasksPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] ?? '');
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [status, setStatus] = useState<TaskStatus | 'all'>((params.get('status') as TaskStatus) || 'all');
  const [priority, setPriority] = useState<TaskPriority | 'all'>((params.get('priority') as TaskPriority) || 'all');
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [createOpen, setCreateOpen] = useState(params.get('new') === '1');
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');
  const queryParams = useMemo(() => ({ ...(search ? { search } : {}), ...(status !== 'all' ? { status } : {}), ...(priority !== 'all' ? { priority } : {}) }), [search, status, priority]);
  const { data: tasks, isLoading, isError, refetch } = useListTasks(queryParams);
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const taskList = tasks ?? [];
  const activeFilterCount = (status !== 'all' ? 1 : 0) + (priority !== 'all' ? 1 : 0);

  useEffect(() => { if (params.get('new') === '1') setCreateOpen(true); }, [location]);
  const clearFilters = () => { setSearch(''); setStatus('all'); setPriority('all'); setLocation('/tasks'); };
  const changeStatus = (task: Task, next: TaskStatus) => {
    updateTask.mutate({ id: task.id, data: { status: next } }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setNotice(next === 'done' ? 'Nice. One less thing to carry.' : `Moved to ${statusLabel(next)}`); },
    });
  };
  return (
    <>
      <section className="animate-rise-in flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace / tasks</p><h1 data-testid="text-tasks-heading" className="mt-3 text-4xl font-extrabold tracking-[-0.065em]">All tasks<span className="text-primary">.</span></h1><p className="mt-3 text-sm text-muted-foreground">Keep the work visible. Keep the next move close.</p></div><button type="button" data-testid="button-create-task" onClick={() => setCreateOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-[0_4px_0_hsl(43_88%_42%)]"><Plus size={15} /> New task</button></section>
      <section className="mt-9 rounded-2xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input type="search" data-testid="input-task-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search task names and context" className="w-full rounded-xl border border-transparent bg-muted/60 py-2.5 pl-9 pr-3 text-xs font-semibold outline-none transition focus:border-primary focus:bg-card" /></div><div className="flex flex-wrap gap-2"><div className="relative"><select data-testid="select-filter-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | 'all')} className="h-10 appearance-none rounded-xl border border-border bg-card px-3 pr-8 text-xs font-bold outline-none transition hover:border-foreground/30"><option value="all">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3.5 text-muted-foreground" /></div><div className="relative"><select data-testid="select-filter-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | 'all')} className="h-10 appearance-none rounded-xl border border-border bg-card px-3 pr-8 text-xs font-bold outline-none transition hover:border-foreground/30"><option value="all">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{priorityLabel(value)}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3.5 text-muted-foreground" /></div>{activeFilterCount > 0 && <button type="button" data-testid="button-clear-filters" onClick={clearFilters} className="flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"><X size={13} /> Clear</button>}</div></div>
      </section>
      <div className="mt-5 flex items-center justify-between"><div className="flex items-center gap-2"><ListFilter size={14} className="text-muted-foreground" /><span data-testid="text-task-count" className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{isLoading ? 'Loading tasks' : `${taskList.length} ${taskList.length === 1 ? 'task' : 'tasks'}`}</span></div>{activeFilterCount > 0 && <span className="rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-bold text-[hsl(33_70%_35%)]">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}</div>
      <section className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[auto_1fr_120px_110px_auto] gap-4 border-b border-border bg-muted/35 px-5 py-3 md:grid"><span /><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Task</span><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Status</span><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Priority</span><span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Due</span></div>
        {isLoading ? <div data-testid="status-loading-tasks" className="space-y-1 p-4">{[1, 2, 3, 4].map((i) => <LoadingBlock key={i} className="h-16" />)}</div> : isError ? <div className="p-4"><ErrorMessage onRetry={() => refetch()} /></div> : taskList.length ? taskList.map((task) => <TaskRow key={task.id} task={task} onEdit={(selected) => setModalTask(selected)} onDelete={(selected) => setDeleteTask(selected)} onStatusChange={changeStatus} />) : <div data-testid="empty-task-list" className="flex flex-col items-center px-6 py-16 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary"><Search size={21} /></div><h2 className="mt-5 text-base font-extrabold">{search || activeFilterCount ? 'Nothing matches that view.' : 'Your task list is wide open.'}</h2><p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{search || activeFilterCount ? 'Try a different search or clear the filters to see more of your plan.' : 'Start with the task that will make tomorrow feel lighter.'}</p><button type="button" data-testid={search || activeFilterCount ? 'button-empty-clear-filters' : 'button-empty-create-task'} onClick={search || activeFilterCount ? clearFilters : () => setCreateOpen(true)} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground">{search || activeFilterCount ? 'Clear view' : 'Add a task'}</button></div>}
      </section>
      <TaskModal open={createOpen || !!modalTask} task={modalTask} onClose={() => { setCreateOpen(false); setModalTask(null); if (params.get('new')) setLocation('/tasks'); }} onSaved={(message) => { setNotice(message); setCreateOpen(false); setModalTask(null); }} />
      <DeleteModal task={deleteTask} onClose={() => setDeleteTask(null)} onDeleted={setNotice} />
      {notice && <Notice message={notice} onClose={() => setNotice('')} />}
    </>
  );
}

function SettingsPage() {
  const [compact, setCompact] = useState(false);
  const [startWeek, setStartWeek] = useState('monday');
  const [notice, setNotice] = useState('');
  const save = () => { localStorage.setItem('daymark-settings', JSON.stringify({ compact, startWeek })); setNotice('Preferences saved'); };
  useEffect(() => { const saved = localStorage.getItem('daymark-settings'); if (saved) { const value = JSON.parse(saved) as { compact?: boolean; startWeek?: string }; setCompact(value.compact ?? false); setStartWeek(value.startWeek ?? 'monday'); } }, []);
  return (
    <>
      <section className="animate-rise-in"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace / preferences</p><h1 data-testid="text-settings-heading" className="mt-3 text-4xl font-extrabold tracking-[-0.065em]">Make it yours<span className="text-primary">.</span></h1><p className="mt-3 max-w-lg text-sm text-muted-foreground">A couple of quiet choices for a workspace that fits how you actually work.</p></section>
      <section className="mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Display</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em]">Workspace rhythm</h2></div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-6 px-6 py-5"><div><p className="text-sm font-bold">Compact task rows</p><p className="mt-1 text-xs text-muted-foreground">Fit more of the plan on one screen.</p></div><button type="button" data-testid="button-toggle-compact-rows" onClick={() => setCompact(!compact)} aria-pressed={compact} className={cn('relative h-6 w-11 rounded-full transition-colors', compact ? 'bg-primary' : 'bg-muted')}><span className={cn('absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-transform', compact ? 'translate-x-6' : 'translate-x-1')} /></button></div>
          <div className="flex items-center justify-between gap-6 px-6 py-5"><div><p className="text-sm font-bold">Week begins on</p><p className="mt-1 text-xs text-muted-foreground">Used for planning context.</p></div><select data-testid="select-week-start" value={startWeek} onChange={(e) => setStartWeek(e.target.value)} className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-bold outline-none focus:border-primary"><option value="monday">Monday</option><option value="sunday">Sunday</option></select></div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted/25 px-6 py-4"><span className="text-[11px] text-muted-foreground">Changes stay on this device.</span><button type="button" data-testid="button-save-preferences" onClick={save} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5">Save preferences</button></div>
      </section>
      <section className="mt-7 max-w-3xl rounded-2xl border border-border bg-[hsl(211_34%_18%)] p-6 text-[hsl(38_32%_94%)]"><div className="flex items-center gap-2 text-primary"><Zap size={15} /><span className="font-mono text-[10px] uppercase tracking-[0.16em]">Daymark principle</span></div><p className="mt-5 max-w-lg text-xl font-extrabold leading-tight tracking-[-0.04em]">The plan is not the work. It is the calm space around it.</p></section>
      {notice && <Notice message={notice} onClose={() => setNotice('')} />}
    </>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={Dashboard} /><Route path="/tasks" component={TasksPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></QueryClientProvider>;
}

export default App;