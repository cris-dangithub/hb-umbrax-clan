type EventData = Record<string, unknown>

interface PublishPayload {
  topic: string
  event: string
  data: EventData
}

interface PublishMultiplePayload {
  topics: string[]
  event: string
  data: EventData
}

interface PublishResponse {
  success: boolean
  message: string
  details?: {
    topic?: string
    topics?: string[]
    event: string
    subscribers?: number
    total_subscribers?: number
  }
}

/**
 * Cliente WebSocket para comunicación Next.js → Rust Server
 * Usa HTTP POST para publicar eventos (más simple que WebSocket persistente)
 */
class WebSocketClient {
  private static instance: WebSocketClient | null = null
  private serverUrl: string
  private retryAttempts = 0
  private maxRetryAttempts = 3
  private retryDelay = 1000

  private constructor() {
    this.serverUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL || 'http://localhost:3000'
    // Convertir wss:// a https:// y ws:// a http:// para endpoints REST
    this.serverUrl = this.serverUrl.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://')
    
    console.log('[WebSocketClient] Initialized with server:', this.serverUrl)
  }

  static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient()
    }
    return WebSocketClient.instance
  }

  /**
   * Publica un evento a un único tópico
   * @param topic - Tópico destino (ej: "user:123")
   * @param event - Tipo de evento (ej: "time_request")
   * @param data - Datos del evento
   */
  async publish(topic: string, event: string, data: EventData): Promise<void> {
    const payload: PublishPayload = { topic, event, data }

    try {
      const response = await this.makeRequest('/publish', payload)
      
      if (response.success) {
        console.log(`[WebSocketClient] ✅ Published "${event}" to "${topic}"`)
        if (response.details?.subscribers !== undefined) {
          console.log(`   → Delivered to ${response.details.subscribers} subscriber(s)`)
        }
      } else {
        throw new Error(response.message || 'Publish failed')
      }

      // Reset retry counter on success
      this.retryAttempts = 0
    } catch (error) {
      console.error(`[WebSocketClient] ❌ Failed to publish "${event}" to "${topic}":`, error)
      
      // Retry logic
      if (this.retryAttempts < this.maxRetryAttempts) {
        this.retryAttempts++
        const delay = this.retryDelay * this.retryAttempts
        
        console.log(`[WebSocketClient] Retrying in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.publish(topic, event, data) // Recursive retry
      }
      
      // Max retries reached
      this.retryAttempts = 0
      throw error
    }
  }

  /**
   * Publica un evento a múltiples tópicos
   * @param topics - Array de tópicos destino
   * @param event - Tipo de evento
   * @param data - Datos del evento
   */
  async publishToMultiple(topics: string[], event: string, data: EventData): Promise<void> {
    if (topics.length === 0) {
      console.warn('[WebSocketClient] publishToMultiple called with empty topics array')
      return
    }

    // Si es solo 1 tópico, usar publish simple
    if (topics.length === 1) {
      return this.publish(topics[0], event, data)
    }

    const payload: PublishMultiplePayload = { topics, event, data }

    try {
      const response = await this.makeRequest('/publish-multiple', payload)
      
      if (response.success) {
        console.log(`[WebSocketClient] ✅ Published "${event}" to ${topics.length} topic(s)`)
        if (response.details?.total_subscribers !== undefined) {
          console.log(`   → Delivered to ${response.details.total_subscribers} total subscriber(s)`)
        }
      } else {
        throw new Error(response.message || 'Publish multiple failed')
      }

      this.retryAttempts = 0
    } catch (error) {
      console.error(`[WebSocketClient] ❌ Failed to publish "${event}" to multiple topics:`, error)
      
      if (this.retryAttempts < this.maxRetryAttempts) {
        this.retryAttempts++
        const delay = this.retryDelay * this.retryAttempts
        
        console.log(`[WebSocketClient] Retrying in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.publishToMultiple(topics, event, data)
      }
      
      this.retryAttempts = 0
      throw error
    }
  }

  /**
   * Hace request HTTP al servidor Rust
   */
  private async makeRequest(endpoint: string, payload: PublishPayload | PublishMultiplePayload): Promise<PublishResponse> {
    const url = `${this.serverUrl}${endpoint}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    return response.json()
  }

  /**
   * Verifica salud del servidor WebSocket
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`)
      return response.ok
    } catch (error) {
      console.error('[WebSocketClient] Health check failed:', error)
      return false
    }
  }
}

// Singleton export
export const websocketClient = WebSocketClient.getInstance()
