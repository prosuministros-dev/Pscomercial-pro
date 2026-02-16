'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Loader2, Plus, ClipboardList, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderPendingTasks, useCreatePendingTask, useUpdatePendingTask } from '../_lib/order-queries';
import { TASK_TYPE_LABELS, PRIORITY_LABELS, TRAFFIC_LIGHT_COLORS } from '../_lib/schemas';
import type { OrderPendingTask } from '../_lib/types';

interface PendingTasksPanelProps {
  orderId: string;
}

export function PendingTasksPanel({ orderId }: PendingTasksPanelProps) {
  const { data: tasks = [], isLoading } = useOrderPendingTasks(orderId);
  const createTask = useCreatePendingTask();
  const updateTask = useUpdatePendingTask();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<string>('purchase');
  const [priority, setPriority] = useState<string>('medium');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Título es requerido');
      return;
    }
    try {
      await createTask.mutateAsync({
        order_id: orderId,
        task_type: taskType as any,
        title,
        description: description || undefined,
        priority: priority as any,
        due_date: dueDate || undefined,
      });
      toast.success('Tarea creada');
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const handleToggleComplete = async (task: OrderPendingTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask.mutateAsync({ taskId: task.id, orderId, status: newStatus });
      toast.success(newStatus === 'completed' ? 'Tarea completada' : 'Tarea reabierta');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Tareas Pendientes</h4>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Tarea
        </Button>
      </div>

      {(tasks as OrderPendingTask[]).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay tareas pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(tasks as OrderPendingTask[]).map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-3 flex items-start gap-3 ${task.status === 'completed' ? 'opacity-60' : ''}`}
            >
              <button onClick={() => handleToggleComplete(task)} className="mt-0.5">
                <CheckCircle2
                  className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-400'}`}
                />
              </button>
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${TRAFFIC_LIGHT_COLORS[task.traffic_light] || 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                  </Badge>
                  <Badge variant={priorityColor(task.priority)} className="text-[10px]">
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                )}
                <div className="flex gap-3 text-xs text-gray-400 mt-1">
                  {task.due_date && (
                    <span>Vence: {new Date(task.due_date).toLocaleDateString('es-CO')}</span>
                  )}
                  {task.assigned_user && (
                    <span>Asignado: {task.assigned_user.display_name}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                  {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createTask.isPending}>
              {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
