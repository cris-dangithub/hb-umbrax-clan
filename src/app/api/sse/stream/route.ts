import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { sseEmitter } from '@/lib/sse-emitter';

/**
 * GET /api/sse/stream?topic=user:{userId}
 * Endpoint SSE para notificaciones en tiempo real
 * 
 * Eventos soportados:
 * - session_created: Nueva sesión iniciada
 * - session_updated: Sesión actualizada (transferencia, etc)
 * - session_closed: Sesión finalizada
 * - time_request: Solicitud de time recibida
 * - time_request_result: Respuesta a solicitud enviada
 * - invalidate: Forzar refetch completo
 * - heartbeat: Keep-alive cada 30s
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[SSE] Nueva solicitud de conexión');
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      console.error('[SSE] Usuario no autenticado');
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log(`[SSE] Usuario autenticado: ${currentUser.habboName} (${currentUser.id})`);

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');
    const lastEventId = searchParams.get('lastEventId');

    console.log(`[SSE] Topic solicitado: ${topic}, lastEventId: ${lastEventId}`);

    if (!topic) {
      console.error('[SSE] Falta parámetro topic');
      return new Response('Missing topic parameter', { status: 400 });
    }

    // Validar que el usuario tiene acceso al topic
    const userTopic = `user:${currentUser.id}`;
    const isGlobalTopic = topic === 'global';
    const isUserTopic = topic === userTopic;

    console.log(`[SSE] Validación: userTopic=${userTopic}, isUserTopic=${isUserTopic}, isGlobalTopic=${isGlobalTopic}`);

    if (!isUserTopic && !isGlobalTopic) {
      console.error(`[SSE] Acceso denegado: usuario ${currentUser.id} intentó acceder a topic ${topic}`);
      return new Response('Forbidden: Invalid topic', { status: 403 });
    }
    
    console.log(`[SSE] Iniciando stream para topic: ${topic}`);

    // Crear stream SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const subscriberId = `${currentUser.id}-${Date.now()}`;

        // Enviar mensaje inicial de conexión
        const initMessage = [
          `id: ${lastEventId || '0'}`,
          `event: connected`,
          `data: ${JSON.stringify({ 
            userId: currentUser.id, 
            topic,
            timestamp: new Date().toISOString() 
          })}`,
          '',
          ''
        ].join('\n');
        
        controller.enqueue(encoder.encode(initMessage));

        // Suscribir al topic
        const unsubscribe = sseEmitter.subscribe(
          topic,
          (message) => {
            try {
              controller.enqueue(encoder.encode(message + '\n'));
            } catch (error) {
              console.error('[SSE] Error enqueuing message:', error);
            }
          },
          subscriberId
        );

        // Cleanup cuando se cierra la conexión
        const cleanup = () => {
          console.log(`[SSE] Cerrando conexión para ${subscriberId}`);
          unsubscribe();
          try {
            controller.close();
          } catch {
            // Controller ya cerrado
          }
        };

        // Detectar cierre de conexión
        request.signal.addEventListener('abort', cleanup);

        return cleanup;
      },
    });

    // Configurar headers SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx
        'X-Content-Type-Options': 'nosniff',
        // Headers para dev-tunnels y proxies
        'Access-Control-Allow-Origin': '*', // Solo en dev
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  } catch (error) {
    console.error('[SSE] Error crítico en stream endpoint:', error);
    console.error('[SSE] Stack:', error instanceof Error ? error.stack : 'No stack available');
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

// Deshabilitar body parser y timeouts para SSE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos (Vercel limit)
