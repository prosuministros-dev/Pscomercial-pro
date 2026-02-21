'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Phone,
  XCircle,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmbeddedSignupProps {
  organizationName: string;
  onComplete?: () => void;
}

type SetupState = 'idle' | 'loading-sdk' | 'connecting' | 'success' | 'error';

/* ------------------------------------------------------------------ */
/*  Facebook SDK typings (minimal)                                     */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { code?: string };
          status: string;
        }) => void,
        options: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: { setup: Record<string, never> };
        },
      ) => void;
    };
    fbAsyncInit: () => void;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EmbeddedSignup({
  organizationName,
  onComplete,
}: EmbeddedSignupProps) {
  const [state, setState] = useState<SetupState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const sdkLoaded = useRef(false);

  /* ---- Load the Facebook SDK ---- */
  const initFB = useCallback(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID ?? '';
    if (!appId) {
      console.error('[EmbeddedSignup] NEXT_PUBLIC_META_APP_ID is not set');
    }
    window.FB.init({
      appId,
      cookie: true,
      xfbml: true,
      version: 'v21.0',
    });
  }, []);

  const loadFacebookSdk = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // SDK already loaded — just (re)init and resolve
      if (window.FB) {
        initFB();
        resolve();
        return;
      }

      if (sdkLoaded.current) {
        // Script already appended; wait for it to initialise.
        const check = setInterval(() => {
          if (window.FB) {
            clearInterval(check);
            initFB();
            resolve();
          }
        }, 200);
        // Timeout after 10s
        setTimeout(() => {
          clearInterval(check);
          reject(new Error('Facebook SDK load timeout'));
        }, 10000);
        return;
      }

      sdkLoaded.current = true;

      window.fbAsyncInit = () => {
        initFB();
        resolve();
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
      document.body.appendChild(script);
    });
  }, [initFB]);

  /* ---- Launch the Embedded Signup flow ---- */
  const launchEmbeddedSignup = useCallback(async () => {
    setState('loading-sdk');
    setErrorMessage('');

    try {
      await loadFacebookSdk();
    } catch {
      setState('error');
      setErrorMessage(
        'No se pudo cargar el SDK de Facebook. Verifica tu conexión.',
      );
      toast.error('Error al cargar el SDK de Facebook');
      return;
    }

    setState('connecting');

    const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID ?? '';

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          submitOAuthCode(response.authResponse.code);
        } else {
          setState('idle');
          toast.info('Inicio de sesión cancelado');
        }
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  }, [loadFacebookSdk]);

  /* ---- Send the OAuth code to the back-end ---- */
  const submitOAuthCode = async (code: string) => {
    try {
      const res = await fetch('/api/whatsapp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ??
            'Error al configurar WhatsApp Business',
        );
      }

      setState('success');
      toast.success('WhatsApp Business conectado correctamente');
      onComplete?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido';
      setState('error');
      setErrorMessage(msg);
      toast.error('Error al conectar WhatsApp', { description: msg });
    }
  };

  /* ---- Cleanup SDK script on unmount ---- */
  useEffect(() => {
    return () => {
      // Nothing critical – the script stays in the DOM on purpose
      // (Facebook SDK doesn't support removal).
    };
  }, []);

  /* ---- Render ---- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-lg"
    >
      <Card className="border-border bg-card shadow-lg">
        {/* Header with WhatsApp branding */}
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Conectar WhatsApp Business
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Conecta la cuenta de WhatsApp Business de{' '}
            <span className="font-semibold text-foreground">
              {organizationName}
            </span>{' '}
            para enviar y recibir mensajes directamente desde la plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Feature list */}
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              'Envía mensajes y plantillas aprobadas por Meta',
              'Recibe mensajes de tus clientes en tiempo real',
              'Automatiza respuestas con chatbot integrado',
              'Historial completo de conversaciones',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#25D366]" />
                {feature}
              </li>
            ))}
          </ul>

          {/* State-driven UI */}
          <AnimatePresence mode="wait">
            {state === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 p-4 text-center"
              >
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[#25D366]" />
                <p className="font-semibold text-foreground">
                  Conexión exitosa
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  WhatsApp Business fue vinculado correctamente.
                </p>
              </motion.div>
            ) : state === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                  <XCircle className="mx-auto mb-2 h-10 w-10 text-destructive" />
                  <p className="font-semibold text-foreground">
                    Error al conectar
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
                <Button
                  onClick={launchEmbeddedSignup}
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851]"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Reintentar conexión
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={launchEmbeddedSignup}
                  disabled={state === 'loading-sdk' || state === 'connecting'}
                  className="w-full bg-[#25D366] text-white hover:bg-[#1da851] disabled:opacity-70"
                  size="lg"
                >
                  {state === 'loading-sdk' || state === 'connecting' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {state === 'loading-sdk'
                        ? 'Cargando SDK...'
                        : 'Conectando...'}
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Conectar con WhatsApp
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footnote */}
          <p className="text-center text-xs text-muted-foreground">
            Al conectar, autorizas a la plataforma a gestionar mensajes en
            nombre de tu cuenta de WhatsApp Business.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
