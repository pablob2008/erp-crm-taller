import { useState } from "react"
import type { WorkOrderComposite } from "@/lib/services/work-order-details"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle2, 
  Circle, 
  Send, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  MessageCircle, 
  Users, 
  Smartphone, 
  Wrench, 
  CheckSquare, 
  MessageSquare,
  Calendar
} from "lucide-react"

// Utility: build a WhatsApp URL from a phone string
function buildWhatsAppUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

interface OverviewTabProps {
  order: WorkOrderComposite;
  currentUserId?: string;
  onAddNote: (content: string, authorId: string) => Promise<void>;
  onAddTask: (title: string, branchId: string) => Promise<void>;
  onToggleTask: (taskId: string, isCompleted: boolean) => Promise<void>;
  onUpdateTask: (taskId: string, title: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUpdateNote: (noteId: string, content: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export function OverviewTab({ 
  order, 
  currentUserId, 
  onAddNote, 
  onAddTask, 
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateNote,
  onDeleteNote
}: OverviewTabProps) {
  const [newNote, setNewNote] = useState("")
  const [newTask, setNewTask] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState("")

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteContent, setEditNoteContent] = useState("")

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentUserId) return;
    setIsAddingNote(true)
    try {
      await onAddNote(newNote, currentUserId)
      setNewNote("")
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.trim() || !order.branch_id) return;
    setIsAddingTask(true)
    try {
      await onAddTask(newTask, order.branch_id)
      setNewTask("")
    } finally {
      setIsAddingTask(false)
    }
  }


  const t = {
    received: {
      cardBg: 'bg-kpi-blue/5',
      cardBorder: 'border-kpi-blue/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-blue)/0.08)]',
      accentBar: 'bg-kpi-blue',
      iconBg: 'bg-kpi-blue/15',
      iconText: 'text-kpi-blue',
      iconBorder: 'border-kpi-blue/20',
      buttonBg: 'bg-kpi-blue/15',
      buttonText: 'text-kpi-blue',
      buttonBorder: 'border-kpi-blue/30',
      buttonHoverBg: 'hover:bg-kpi-blue/25',
    },
    waiting_client: {
      cardBg: 'bg-kpi-amber/5',
      cardBorder: 'border-kpi-amber/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.08)]',
      accentBar: 'bg-kpi-amber',
      iconBg: 'bg-kpi-amber/15',
      iconText: 'text-kpi-amber',
      iconBorder: 'border-kpi-amber/20',
      buttonBg: 'bg-kpi-amber/15',
      buttonText: 'text-kpi-amber',
      buttonBorder: 'border-kpi-amber/30',
      buttonHoverBg: 'hover:bg-kpi-amber/25',
    },
    waiting_parts: {
      cardBg: 'bg-kpi-red/5',
      cardBorder: 'border-kpi-red/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.08)]',
      accentBar: 'bg-kpi-red',
      iconBg: 'bg-kpi-red/15',
      iconText: 'text-kpi-red',
      iconBorder: 'border-kpi-red/20',
      buttonBg: 'bg-kpi-red/15',
      buttonText: 'text-kpi-red',
      buttonBorder: 'border-kpi-red/30',
      buttonHoverBg: 'hover:bg-kpi-red/25',
    },
    ready_for_pickup: {
      cardBg: 'bg-kpi-green/5',
      cardBorder: 'border-kpi-green/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-green)/0.08)]',
      accentBar: 'bg-kpi-green',
      iconBg: 'bg-kpi-green/15',
      iconText: 'text-kpi-green',
      iconBorder: 'border-kpi-green/20',
      buttonBg: 'bg-kpi-green/15',
      buttonText: 'text-kpi-green',
      buttonBorder: 'border-kpi-green/30',
      buttonHoverBg: 'hover:bg-kpi-green/25',
    },
    quotation: {
      cardBg: 'bg-kpi-amber/5',
      cardBorder: 'border-kpi-amber/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-amber)/0.08)]',
      accentBar: 'bg-kpi-amber',
      iconBg: 'bg-kpi-amber/15',
      iconText: 'text-kpi-amber',
      iconBorder: 'border-kpi-amber/20',
      buttonBg: 'bg-kpi-amber/15',
      buttonText: 'text-kpi-amber',
      buttonBorder: 'border-kpi-amber/30',
      buttonHoverBg: 'hover:bg-kpi-amber/25',
    },
    cancelled: {
      cardBg: 'bg-kpi-red/5',
      cardBorder: 'border-kpi-red/30',
      cardGlow: 'shadow-[0_0_24px_0_hsl(var(--kpi-red)/0.08)]',
      accentBar: 'bg-kpi-red',
      iconBg: 'bg-kpi-red/15',
      iconText: 'text-kpi-red',
      iconBorder: 'border-kpi-red/20',
      buttonBg: 'bg-kpi-red/15',
      buttonText: 'text-kpi-red',
      buttonBorder: 'border-kpi-red/30',
      buttonHoverBg: 'hover:bg-kpi-red/25',
    },
    delivered: {
      cardBg: 'bg-muted/10',
      cardBorder: 'border-border/40',
      cardGlow: 'shadow-sm',
      accentBar: 'bg-muted-foreground',
      iconBg: 'bg-muted',
      iconText: 'text-foreground',
      iconBorder: 'border-border/30',
      buttonBg: 'bg-muted/50',
      buttonText: 'text-foreground',
      buttonBorder: 'border-border/40',
      buttonHoverBg: 'hover:bg-muted',
    },
  }[order.status] ?? {
    cardBg: 'bg-muted/10',
    cardBorder: 'border-border/40',
    cardGlow: 'shadow-sm',
    accentBar: 'bg-muted-foreground',
    iconBg: 'bg-muted',
    iconText: 'text-foreground',
    iconBorder: 'border-border/30',
    buttonBg: 'bg-muted/50',
    buttonText: 'text-foreground',
    buttonBorder: 'border-border/40',
    buttonHoverBg: 'hover:bg-muted',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* ── 1. Perfil del Cliente ─────────────────────────────────────────── */}
      <div className={`group relative rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.cardGlow} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${t.accentBar} rounded-l-2xl`} />
        {/* Shimmer on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${t.iconBg} ${t.iconText} border ${t.iconBorder}`}>
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Perfil del Cliente</h3>
          </div>
        </div>

        <div className="p-6 pl-7 space-y-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre Completo</span>
            <p className="font-semibold text-base text-foreground mt-0.5">
              {order.customers?.first_name} {order.customers?.last_name}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tel\u00e9fono / WhatsApp</span>
            <div className="flex items-center justify-between mt-0.5">
              <p className="font-medium text-foreground">
                {order.customers?.phone || (
                  <span className="text-muted-foreground italic text-sm">Sin tel\u00e9fono</span>
                )}
              </p>
              {order.customers?.phone && (
                <a
                  href={buildWhatsAppUrl(order.customers.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-kpi-green/15 text-kpi-green border border-kpi-green/30 hover:bg-kpi-green/25 hover:scale-105 transition-all shadow-sm"
                  title="Abrir chat de WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chatear</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</span>
              <p className="font-medium text-foreground truncate mt-0.5">
                {order.customers?.email || <span className="text-muted-foreground italic text-sm">\u2014</span>}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CUIT / DNI</span>
              <p className="font-medium text-foreground mt-0.5">
                {order.customers?.tax_id || <span className="text-muted-foreground italic text-sm">\u2014</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Especificaciones del Dispositivo ───────────────────────────── */}
      <div className={`group relative rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.cardGlow} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${t.accentBar} rounded-l-2xl`} />
        {/* Shimmer on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${t.iconBg} ${t.iconText} border ${t.iconBorder}`}>
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Dispositivo</h3>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.iconBg} ${t.iconText} border ${t.cardBorder}`}>
            {order.device_brand}
          </span>
        </div>

        <div className="p-6 pl-7 space-y-3.5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modelo</span>
              <p className="font-semibold text-foreground mt-0.5">{order.device_model}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</span>
              <p className="font-medium text-foreground mt-0.5">
                {order.device_color || <span className="text-muted-foreground italic text-sm">\u2014</span>}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Condici\u00f3n Est\u00e9tica</span>
            <p className="font-medium text-foreground mt-0.5">
              {order.aesthetic_condition || <span className="text-muted-foreground italic text-sm">\u2014</span>}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accesorios Entregados</span>
            <p className="font-medium text-foreground mt-0.5">
              {order.accessories || <span className="text-muted-foreground italic text-sm">\u2014</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Diagnóstico y Agenda ───────────────────────────────────────── */}
      <div className={`col-span-1 md:col-span-2 group relative rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.cardGlow} transition-all duration-200 hover:scale-[1.005] hover:brightness-105 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${t.accentBar} rounded-l-2xl`} />
        {/* Shimmer on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${t.iconBg} ${t.iconText} border ${t.iconBorder}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Diagn\u00f3stico y Agenda</h3>
          </div>
        </div>

        <div className="p-6 pl-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Problema Reportado por el Cliente</span>
              <p className="text-sm font-medium text-foreground mt-1 bg-background/40 p-3 rounded-xl border border-border/40 shadow-sm backdrop-blur-md">
                {order.reported_problem}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Soluci\u00f3n / Diagn\u00f3stico Inicial</span>
              <p className="text-sm font-medium text-foreground mt-1 bg-background/40 p-3 rounded-xl border border-border/40 shadow-sm backdrop-blur-md">
                {order.suggested_solution || <span className="text-muted-foreground italic text-xs">Sin diagn\u00f3stico preliminar cargado</span>}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Ingreso</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className={`w-4 h-4 ${t.iconText}`} />
                <p className="font-medium text-foreground">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
                    : <span className="text-muted-foreground italic text-sm">\u2014</span>}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Entrega Estimada</span>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className={`w-4 h-4 ${t.iconText}`} />
                <p className="font-medium text-foreground">
                  {order.estimated_delivery_at
                    ? new Date(order.estimated_delivery_at).toLocaleDateString("es-AR", { dateStyle: "long" })
                    : <span className="text-muted-foreground italic text-sm">\u2014</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Tareas (Checklist) ─────────────────────────────────────────── */}
      <div className={`group relative flex flex-col rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.cardGlow} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${t.accentBar} rounded-l-2xl`} />
        {/* Shimmer on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${t.iconBg} ${t.iconText} border ${t.iconBorder}`}>
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Tareas (Checklist)</h3>
          </div>
          <span className={`text-xs font-semibold ${t.iconText}`}>
            {order.tasks?.filter(t => t.is_completed).length || 0}/{order.tasks?.length || 0} completadas
          </span>
        </div>

        <div className="p-6 pl-7 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            {order.tasks?.map(task => (
              <div 
                key={task.id} 
                className="flex items-center gap-3 p-3 rounded-xl bg-background/40 hover:bg-background/60 border border-border/40 shadow-sm backdrop-blur-md transition-colors"
              >
                {editingTaskId === task.id ? (
                  <div className="flex-1 flex gap-2 items-center w-full">
                    <Input 
                      value={editTaskTitle}
                      onChange={e => setEditTaskTitle(e.target.value)}
                      className="bg-background/50 border border-border/40 shadow-sm flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={async () => {
                      if(editTaskTitle.trim()) {
                        await onUpdateTask(task.id, editTaskTitle);
                        setEditingTaskId(null);
                      }
                    }} className={`h-8 w-8 ${t.iconText} ${t.buttonHoverBg}`}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingTaskId(null)} className="h-8 w-8 text-kpi-red hover:bg-kpi-red/20">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button 
                      className={`cursor-pointer text-muted-foreground hover:${t.iconText} transition-colors focus:outline-none`} 
                      onClick={() => onToggleTask(task.id, !task.is_completed)}
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className={`h-5 w-5 ${t.iconText} animate-pulse`} />
                      ) : (
                        <Circle className="h-5 w-5 opacity-60" />
                      )}
                    </button>
                    <span className={`text-sm font-medium flex-1 ${task.is_completed ? 'line-through text-muted-foreground opacity-60' : 'text-foreground'}`}>
                      {task.title}
                    </span>
                    <button 
                      className="flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all" 
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditTaskTitle(task.title);
                      }}
                      title="Editar tarea"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      className="flex items-center justify-center h-7 w-7 rounded-full text-kpi-red/70 hover:text-kpi-red hover:bg-kpi-red/15 transition-all" 
                      onClick={() => {
                        if(confirm("\u00bfEliminar tarea?")) onDeleteTask(task.id);
                      }}
                      title="Eliminar tarea"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {(!order.tasks || order.tasks.length === 0) && (
              <p className="text-sm text-muted-foreground italic py-2 text-center">No hay tareas asignadas a esta orden.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <input 
              placeholder="Nueva tarea del checklist..." 
              value={newTask} 
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              className="flex-1 h-9 rounded-full bg-background px-4 py-1 text-sm bg-background/50 border border-border/40 shadow-sm transition-all focus:bg-background placeholder:text-muted-foreground focus-visible:outline-none"
            />
            <button 
              onClick={handleAddTask} 
              disabled={isAddingTask || !newTask.trim()} 
              className={`px-4 py-1.5 rounded-full text-xs font-bold ${t.buttonBg} ${t.buttonText} border ${t.buttonBorder} ${t.buttonHoverBg} hover:scale-105 active:scale-95 disabled:opacity-40 transition-all`}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Notas Internas (Bitácora) ─────────────────────────────────── */}
      <div className={`group relative flex flex-col rounded-2xl border ${t.cardBorder} ${t.cardBg} ${t.cardGlow} transition-all duration-200 hover:scale-[1.01] hover:brightness-105 overflow-hidden`}>
        {/* Left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-1 ${t.accentBar} rounded-l-2xl`} />
        {/* Shimmer on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 pl-7">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${t.iconBg} ${t.iconText} border ${t.iconBorder}`}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground">Notas y Bit\u00e1cora</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {order.work_order_notes?.length || 0} entradas
          </span>
        </div>

        <div className="p-6 pl-7 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {order.work_order_notes?.map(note => (
              <div key={note.id} className="p-3.5 rounded-xl bg-background/40 border border-border/40 shadow-sm backdrop-blur-md relative group/note">
                {editingNoteId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <Textarea 
                      value={editNoteContent}
                      onChange={e => setEditNoteContent(e.target.value)}
                      className="bg-background/50 border border-border/40 shadow-sm min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Cancelar</Button>
                      <Button size="sm" onClick={async () => {
                        if(editNoteContent.trim()) {
                          await onUpdateNote(note.id, editNoteContent);
                          setEditingNoteId(null);
                        }
                      }}>Guardar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/note:opacity-100 transition-opacity flex gap-1 bg-background rounded-full border border-border/40 shadow-sm p-0.5">
                      <button 
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground" 
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditNoteContent(note.content);
                        }}
                        title="Editar nota"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button 
                        className="p-1 rounded-full text-kpi-red/70 hover:text-kpi-red" 
                        onClick={() => {
                          if(confirm("\u00bfEliminar nota?")) onDeleteNote(note.id);
                        }}
                        title="Eliminar nota"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-foreground whitespace-pre-wrap pr-10">{note.content}</p>
                    <p className="text-[11px] text-muted-foreground mt-2 text-right">
                      {new Date(note.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </>
                )}
              </div>
            ))}
            {(!order.work_order_notes || order.work_order_notes.length === 0) && (
              <p className="text-sm text-muted-foreground italic py-2 text-center">No hay notas en la bit\u00e1cora.</p>
            )}
          </div>

          <div className="flex gap-2 items-end pt-2">
            <textarea 
              placeholder="Escribir nota o avance..." 
              value={newNote} 
              onChange={e => setNewNote(e.target.value)}
              className="flex-1 min-h-[70px] rounded-2xl bg-background p-3 text-sm bg-background/50 border border-border/40 shadow-sm transition-all focus:bg-background placeholder:text-muted-foreground focus-visible:outline-none resize-none"
            />
            <button 
              onClick={handleAddNote} 
              disabled={isAddingNote || !newNote.trim()} 
              className={`flex items-center justify-center h-12 w-12 rounded-2xl ${t.buttonBg} ${t.buttonText} border ${t.buttonBorder} ${t.buttonHoverBg} hover:scale-105 active:scale-95 disabled:opacity-40 transition-all shadow-sm shrink-0`}
              title="Agregar nota"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
