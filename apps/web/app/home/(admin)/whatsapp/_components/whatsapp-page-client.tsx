'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { motion } from 'motion/react';
import {
  AlertTriangle,
  Globe,
  Info,
  LogOut,
  MessageCircle,
  Phone,
  Settings,
  Star,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { toast } from 'sonner';

import { EmbeddedSignup } from '~/components/whatsapp/embedded-signup';
import { ChatPanel } from '~/components/whatsapp/chat-panel';
import { TemplateManager } from '~/components/whatsapp/template-manager';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WhatsAppPageClientProps {
  isConnected: boolean;
  organizationId: string;
  accountInfo: {
    phone_number?: string;
    display_name?: string;
    quality_rating?: string;
    connected_at?: string;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Quality rating colours                                             */
/* ------------------------------------------------------------------ */

const QUALITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  GREEN: {
    label: 'Excelente',
    className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  },
  YELLOW: {
    label: 'Media',
    className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  },
  RED: {
    label: 'Baja',
    className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  },
};

/* ------------------------------------------------------------------ */
/*  Settings / Configuration tab                                       */
/* ------------------------------------------------------------------ */

function AccountSettings({
  accountInfo,
}: {
  accountInfo: WhatsAppPageClientProps['accountInfo'];
}) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Error al desconectar');
      }

      toast.success('WhatsApp Business desconectado');
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error', { description: msg });
    } finally {
      setIsDisconnecting(false);
    }
  }, [router]);

  const qualityCfg =
    QUALITY_CONFIG[accountInfo?.quality_rating?.toUpperCase() ?? ''] ??
    QUALITY_CONFIG.GREEN;

  return (
    <div className="space-y-6">
      {/* Account info card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-[#25D366]" />
              Cuenta conectada
            </CardTitle>
            <CardDescription>
              Información de tu cuenta de WhatsApp Business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Display name */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nombre de empresa
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {accountInfo?.display_name ?? 'No disponible'}
                </p>
              </div>

              {/* Phone number */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Número de teléfono
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {accountInfo?.phone_number ?? 'No disponible'}
                </p>
              </div>

              {/* Quality rating */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Calidad de la cuenta
                </p>
                <Badge variant="outline" className={qualityCfg.className}>
                  <Star className="mr-1 h-3 w-3" />
                  {qualityCfg.label}
                </Badge>
              </div>

              {/* Connected since */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Conectada desde
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {accountInfo?.connected_at
                    ? new Date(accountInfo.connected_at).toLocaleDateString(
                        'es-CO',
                        { day: '2-digit', month: 'long', year: 'numeric' },
                      )
                    : 'No disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-border bg-muted/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-primary" />
              Información de la API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              La integración utiliza la API de WhatsApp Business Cloud (Meta).
              Los webhooks están configurados para recibir mensajes entrantes,
              actualizaciones de estado y notificaciones del sistema en tiempo
              real.
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Zona de peligro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Al desconectar WhatsApp Business, se dejarán de recibir y enviar
              mensajes. Las conversaciones existentes se conservarán pero no
              podrás responder hasta reconectar.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Desconectar WhatsApp
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Desconectar WhatsApp Business</DialogTitle>
                  <DialogDescription>
                    Esta acción desconectará tu cuenta de WhatsApp Business de la
                    plataforma. Ya no podrás enviar ni recibir mensajes hasta
                    que vuelvas a conectar.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? 'Desconectando...' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */

export function WhatsAppPageClient({
  isConnected,
  organizationId,
  accountInfo,
}: WhatsAppPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('chat');

  const handleSignupComplete = () => {
    // Refresh the server component to reload the connection status
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/15">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                WhatsApp
              </h1>
              <p className="text-muted-foreground">
                Canal de mensajería empresarial
              </p>
            </div>
          </div>
        </div>

        {isConnected && (
          <Badge
            variant="outline"
            className="w-fit gap-1.5 bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Conectado
          </Badge>
        )}
      </motion.div>

      {/* Content */}
      {!isConnected ? (
        /* ---- Not connected: show Embedded Signup ---- */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="py-8"
        >
          <EmbeddedSignup
            organizationName={accountInfo?.display_name ?? 'tu organización'}
            onComplete={handleSignupComplete}
          />
        </motion.div>
      ) : (
        /* ---- Connected: show tabs ---- */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="chat" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5">
                <Globe className="h-4 w-4" />
                Plantillas
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-6">
              <ChatPanel />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <TemplateManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <AccountSettings accountInfo={accountInfo} />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
