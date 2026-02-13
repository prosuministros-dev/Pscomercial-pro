'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Checkbox } from '@kit/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Plus, Trash2, User, Star, Loader2 } from 'lucide-react';

interface LeadContact {
  id: string;
  lead_id: string;
  contact_name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
}

interface LeadContactsProps {
  leadId: string;
}

export function LeadContacts({ leadId }: LeadContactsProps) {
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newContact, setNewContact] = useState({
    contact_name: '',
    position: '',
    phone: '',
    email: '',
    is_primary: false,
  });

  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/contacts`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddContact = async () => {
    if (!newContact.contact_name.trim()) {
      toast.error('El nombre del contacto es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });

      if (!response.ok) {
        throw new Error('Error al agregar contacto');
      }

      const data = await response.json();
      setContacts((prev) => [...prev, data.data]);
      setNewContact({
        contact_name: '',
        position: '',
        phone: '',
        email: '',
        is_primary: false,
      });
      setIsAdding(false);
      toast.success('Contacto agregado');
    } catch (error) {
      toast.error('Error al agregar el contacto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(
        `/api/leads/${leadId}/contacts?contact_id=${contactId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        toast.success('Contacto eliminado');
      }
    } catch (error) {
      toast.error('Error al eliminar el contacto');
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: contactId, is_primary: true }),
      });

      if (response.ok) {
        setContacts((prev) =>
          prev.map((c) => ({
            ...c,
            is_primary: c.id === contactId,
          }))
        );
        toast.success('Contacto principal actualizado');
      }
    } catch (error) {
      toast.error('Error al actualizar contacto');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">
            Contactos ({contacts.length})
          </h4>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border rounded-lg p-3 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input
                value={newContact.contact_name}
                onChange={(e) =>
                  setNewContact({ ...newContact, contact_name: e.target.value })
                }
                placeholder="Nombre completo"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Cargo</Label>
              <Input
                value={newContact.position}
                onChange={(e) =>
                  setNewContact({ ...newContact, position: e.target.value })
                }
                placeholder="Cargo/Posición"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                placeholder="+57 ..."
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                placeholder="email@empresa.com"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_primary_new"
                checked={newContact.is_primary}
                onCheckedChange={(checked) =>
                  setNewContact({
                    ...newContact,
                    is_primary: checked as boolean,
                  })
                }
              />
              <Label htmlFor="is_primary_new" className="text-xs cursor-pointer">
                Contacto principal
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddContact}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Contacts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No hay contactos adicionales
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {contact.contact_name[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {contact.contact_name}
                    </span>
                    {contact.is_primary && (
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[contact.position, contact.email, contact.phone]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!contact.is_primary && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleSetPrimary(contact.id)}
                    title="Marcar como principal"
                  >
                    <Star className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDeleteContact(contact.id)}
                  title="Eliminar contacto"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
