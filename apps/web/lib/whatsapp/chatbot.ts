import type { SupabaseClient } from '@supabase/supabase-js';

import {
  sendTextMessage,
  sendInteractiveMessage,
  markMessageAsRead,
  type WhatsAppAccount,
  type InteractiveMessage,
} from './send-message';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BotState =
  | 'welcome'
  | 'capture_company'
  | 'capture_nit'
  | 'capture_contact'
  | 'capture_email'
  | 'capture_requirement'
  | 'completed';

export interface CollectedData {
  business_name?: string;
  nit?: string;
  contact_name?: string;
  email?: string;
  requirement?: string;
}

export interface ConversationRecord {
  id: string;
  organization_id: string;
  whatsapp_account_id: string;
  customer_phone: string;
  customer_name?: string | null;
  status: string;
  conversation_type: string;
  intent?: string | null;
  metadata: {
    bot_state?: BotState;
    collected_data?: CollectedData;
    [key: string]: unknown;
  };
}

export interface IncomingMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

interface BotResult {
  success: boolean;
  nextState: BotState;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Extract the text payload from any supported message type.
 */
function extractMessageText(message: IncomingMessage): string {
  if (message.type === 'text' && message.text) {
    return message.text.body.trim();
  }

  if (message.type === 'interactive' && message.interactive) {
    const reply =
      message.interactive.button_reply ?? message.interactive.list_reply;

    return reply?.id ?? '';
  }

  return '';
}

/**
 * Persist the bot_state and collected_data back into the conversation row.
 */
async function updateConversationMetadata(
  supabase: SupabaseClient,
  conversationId: string,
  botState: BotState,
  collectedData: CollectedData,
  extraFields?: Record<string, unknown>,
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    metadata: {
      bot_state: botState,
      collected_data: collectedData,
    },
    ...extraFields,
  };

  const { error } = await supabase
    .from('whatsapp_conversations')
    .update(updatePayload)
    .eq('id', conversationId);

  if (error) {
    console.error('[Chatbot] Failed to update conversation metadata:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Welcome state
// ---------------------------------------------------------------------------

async function handleWelcome(
  waAccount: WhatsAppAccount,
  to: string,
): Promise<void> {
  const interactive: InteractiveMessage = {
    type: 'button',
    body: {
      text: 'Hola! Bienvenido. Soy el asistente virtual. ¿En que puedo ayudarte?',
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: '1', title: 'Solicitar cotización' } },
        { type: 'reply', reply: { id: '2', title: 'Estado de pedido' } },
        { type: 'reply', reply: { id: '3', title: 'Asesoría comercial' } },
      ],
    },
  };

  await sendInteractiveMessage(waAccount, to, interactive);
}

// ---------------------------------------------------------------------------
// Main bot processor
// ---------------------------------------------------------------------------

/**
 * Process an incoming WhatsApp message through the chatbot state machine.
 *
 * @param supabase     - Supabase client with appropriate permissions
 * @param waAccount    - WhatsApp Business account credentials
 * @param conversation - The current conversation row from whatsapp_conversations
 * @param message      - The incoming WhatsApp message
 * @returns BotResult with the next state and success/error info
 */
export async function processBotResponse(
  supabase: SupabaseClient,
  waAccount: WhatsAppAccount,
  conversation: ConversationRecord,
  message: IncomingMessage,
): Promise<BotResult> {
  const currentState: BotState = conversation.metadata?.bot_state ?? 'welcome';
  const collectedData: CollectedData = {
    ...(conversation.metadata?.collected_data ?? {}),
  };
  const to = conversation.customer_phone;

  try {
    // Mark the incoming message as read
    await markMessageAsRead(waAccount, message.id);

    const input = extractMessageText(message);
    let nextState: BotState = currentState;

    switch (currentState) {
      // ------------------------------------------------------------------
      // WELCOME: Show the interactive menu
      // ------------------------------------------------------------------
      case 'welcome': {
        // If this is the first message (no prior interaction), show the menu
        if (!input) {
          await handleWelcome(waAccount, to);
          nextState = 'welcome';
          break;
        }

        // User selected an option
        switch (input) {
          case '1': {
            // Option 1: Solicitar cotizacion -> start data capture
            await sendTextMessage(
              waAccount,
              to,
              'Excelente! Para preparar tu cotizacion necesito algunos datos. ¿Cual es el nombre de tu empresa?',
            );
            nextState = 'capture_company';
            break;
          }

          case '2': {
            // Option 2: Estado de pedido -> human takeover
            await sendTextMessage(
              waAccount,
              to,
              'Gracias por tu interes. Un asesor comercial se pondra en contacto contigo pronto para darte el estado de tu pedido.',
            );
            nextState = 'completed';

            await updateConversationMetadata(
              supabase,
              conversation.id,
              nextState,
              collectedData,
              {
                status: 'human_takeover',
                conversation_type: 'human',
                intent: 'order_status',
              },
            );

            return { success: true, nextState };
          }

          case '3': {
            // Option 3: Asesoria comercial -> human takeover
            await sendTextMessage(
              waAccount,
              to,
              'Gracias por comunicarte con nosotros. Un asesor comercial se pondra en contacto contigo a la brevedad para brindarte la asesoria que necesitas.',
            );
            nextState = 'completed';

            await updateConversationMetadata(
              supabase,
              conversation.id,
              nextState,
              collectedData,
              {
                status: 'human_takeover',
                conversation_type: 'human',
                intent: 'advisory',
              },
            );

            return { success: true, nextState };
          }

          default: {
            // Unrecognized option -> re-show the menu
            await handleWelcome(waAccount, to);
            nextState = 'welcome';
            break;
          }
        }

        break;
      }

      // ------------------------------------------------------------------
      // CAPTURE COMPANY NAME
      // ------------------------------------------------------------------
      case 'capture_company': {
        if (!input) {
          await sendTextMessage(
            waAccount,
            to,
            'Por favor, escribe el nombre de tu empresa.',
          );
          break;
        }

        collectedData.business_name = input;
        nextState = 'capture_nit';

        await sendTextMessage(
          waAccount,
          to,
          `Perfecto, *${input}*. Ahora, ¿cual es el NIT o numero de identificacion de la empresa?`,
        );

        break;
      }

      // ------------------------------------------------------------------
      // CAPTURE NIT
      // ------------------------------------------------------------------
      case 'capture_nit': {
        if (!input) {
          await sendTextMessage(
            waAccount,
            to,
            'Por favor, ingresa el NIT o numero de identificacion.',
          );
          break;
        }

        collectedData.nit = input;
        nextState = 'capture_contact';

        await sendTextMessage(
          waAccount,
          to,
          '¿Cual es tu nombre completo (persona de contacto)?',
        );

        break;
      }

      // ------------------------------------------------------------------
      // CAPTURE CONTACT NAME
      // ------------------------------------------------------------------
      case 'capture_contact': {
        if (!input) {
          await sendTextMessage(
            waAccount,
            to,
            'Por favor, escribe tu nombre completo.',
          );
          break;
        }

        collectedData.contact_name = input;
        nextState = 'capture_email';

        await sendTextMessage(
          waAccount,
          to,
          'Perfecto. ¿Cual es tu correo electronico?',
        );

        break;
      }

      // ------------------------------------------------------------------
      // CAPTURE EMAIL
      // ------------------------------------------------------------------
      case 'capture_email': {
        if (!input) {
          await sendTextMessage(
            waAccount,
            to,
            'Por favor, escribe tu correo electronico.',
          );
          break;
        }

        if (!EMAIL_REGEX.test(input)) {
          await sendTextMessage(
            waAccount,
            to,
            'El formato del correo no parece valido. Por favor, ingresalo nuevamente (ejemplo: nombre@empresa.com).',
          );
          break;
        }

        collectedData.email = input.toLowerCase();
        nextState = 'capture_requirement';

        await sendTextMessage(
          waAccount,
          to,
          'Ultimo paso. Describenos brevemente tu requerimiento o los productos que necesitas cotizar.',
        );

        break;
      }

      // ------------------------------------------------------------------
      // CAPTURE REQUIREMENT & CREATE LEAD
      // ------------------------------------------------------------------
      case 'capture_requirement': {
        if (!input) {
          await sendTextMessage(
            waAccount,
            to,
            'Por favor, describe tu requerimiento o los productos que necesitas.',
          );
          break;
        }

        collectedData.requirement = input;

        // Call the RPC to create the lead
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_lead_from_whatsapp',
          {
            p_org_id: conversation.organization_id,
            p_data: collectedData,
            p_conversation_id: conversation.id,
            p_phone: conversation.customer_phone,
          },
        );

        if (rpcError) {
          console.error('[Chatbot] create_lead_from_whatsapp error:', rpcError.message);

          await sendTextMessage(
            waAccount,
            to,
            'Hubo un problema al registrar tu solicitud. Un asesor te contactara pronto para ayudarte.',
          );

          // Still mark as completed but flag the error
          nextState = 'completed';

          await updateConversationMetadata(
            supabase,
            conversation.id,
            nextState,
            collectedData,
            {
              status: 'human_takeover',
              intent: 'quote_request',
            },
          );

          return { success: false, nextState, error: rpcError.message };
        }

        const leadNumber =
          (rpcResult as Record<string, unknown>)?.lead_number ?? '';

        nextState = 'completed';

        await sendTextMessage(
          waAccount,
          to,
          `¡Tu solicitud ha sido registrada exitosamente! ` +
            `Tu numero de referencia es *${leadNumber}*. ` +
            `Un asesor comercial revisara tu requerimiento y se pondra en contacto contigo pronto. ` +
            `¡Gracias por preferirnos!`,
        );

        await updateConversationMetadata(
          supabase,
          conversation.id,
          nextState,
          collectedData,
          { intent: 'quote_request' },
        );

        return { success: true, nextState };
      }

      // ------------------------------------------------------------------
      // COMPLETED: conversation already finished
      // ------------------------------------------------------------------
      case 'completed': {
        await sendTextMessage(
          waAccount,
          to,
          'Tu solicitud ya fue registrada. Si necesitas algo adicional, un asesor te atendera pronto.',
        );

        return { success: true, nextState: 'completed' };
      }

      default: {
        console.error('[Chatbot] Unknown state:', currentState);
        await handleWelcome(waAccount, to);
        nextState = 'welcome';
        break;
      }
    }

    // Persist the updated state and collected data
    await updateConversationMetadata(
      supabase,
      conversation.id,
      nextState,
      collectedData,
    );

    return { success: true, nextState };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown chatbot error';

    console.error('[Chatbot] processBotResponse exception:', errorMessage);

    return { success: false, nextState: currentState, error: errorMessage };
  }
}
