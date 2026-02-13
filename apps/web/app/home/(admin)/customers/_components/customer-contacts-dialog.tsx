'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Plus, Pencil, Trash2, Star, Mail, Phone, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';
import { useCustomerContacts, useDeleteContact } from '../_lib/customer-queries';
import { ContactFormDialog } from './contact-form-dialog';
import type { Customer, CustomerContact } from '../_lib/types';

interface CustomerContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export function CustomerContactsDialog({
  open,
  onOpenChange,
  customer,
}: CustomerContactsDialogProps) {
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
  const [contactFormMode, setContactFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<CustomerContact | null>(null);

  const { data: contactsData, isLoading } = useCustomerContacts(customer?.id || null);
  const deleteMutation = useDeleteContact();

  const contacts = contactsData?.data || [];

  const handleAddContact = () => {
    setSelectedContact(null);
    setContactFormMode('create');
    setContactFormOpen(true);
  };

  const handleEditContact = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setContactFormMode('edit');
    setContactFormOpen(true);
  };

  const handleDeleteClick = (contact: CustomerContact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (contactToDelete && customer) {
      await deleteMutation.mutateAsync({
        customerId: customer.id,
        contactId: contactToDelete.id,
      });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Contactos de {customer?.business_name}</span>
              <Button size="sm" onClick={handleAddContact}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar contacto
              </Button>
            </DialogTitle>
            <DialogDescription>
              Gestione los contactos asociados a este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <svg
                    className="h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay contactos</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  Este cliente aún no tiene contactos asociados. Agregue el primer contacto
                  para facilitar la comunicación.
                </p>
                <Button onClick={handleAddContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar primer contacto
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {contacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{contact.full_name}</h4>
                            {contact.is_primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Star className="h-3 w-3 fill-primary" />
                                Principal
                              </span>
                            )}
                          </div>

                          {contact.position && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4" />
                              <span>{contact.position}</span>
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-primary hover:underline"
                              >
                                {contact.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-primary hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditContact(contact)}
                            aria-label="Editar contacto"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(contact)}
                            aria-label="Eliminar contacto"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {customer && (
        <ContactFormDialog
          open={contactFormOpen}
          onOpenChange={setContactFormOpen}
          customerId={customer.id}
          contact={selectedContact}
          mode={contactFormMode}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el contacto{' '}
              <strong>{contactToDelete?.full_name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
