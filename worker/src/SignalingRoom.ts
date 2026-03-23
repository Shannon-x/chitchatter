interface Session {
  ws: WebSocket
  peerId: string
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetPeerId: string
  [key: string]: unknown
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  targetPeerId: string
  [key: string]: unknown
}

const MAX_CONNECTIONS_PER_ROOM = 50
const MAX_MESSAGE_SIZE = 65536 // 64KB
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const MAX_CONNECTIONS_PER_WINDOW = 20

export class SignalingRoom {
  private sessions: Map<string, Session> = new Map()
  private recentConnections: number[] = []

  constructor(
    private state: DurableObjectState,
    private env: Record<string, unknown>
  ) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }

    if (this.sessions.size >= MAX_CONNECTIONS_PER_ROOM) {
      return new Response('Room is full', { status: 503 })
    }

    // Rate limiting
    const now = Date.now()
    this.recentConnections = this.recentConnections.filter(
      time => now - time < RATE_LIMIT_WINDOW_MS
    )
    if (this.recentConnections.length >= MAX_CONNECTIONS_PER_WINDOW) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
    this.recentConnections.push(now)

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    server.accept()

    const peerId = crypto.randomUUID()

    const existingPeerIds = Array.from(this.sessions.keys())

    server.send(
      JSON.stringify({
        type: 'init',
        peerId,
        peerIds: existingPeerIds,
      })
    )

    this.sessions.set(peerId, { ws: server, peerId })

    this.broadcast({ type: 'peer-joined', peerId }, peerId)

    server.addEventListener('message', (event: MessageEvent) => {
      if (typeof event.data !== 'string') return

      if (event.data.length > MAX_MESSAGE_SIZE) {
        server.close(1009, 'Message too large')
        return
      }

      try {
        const data = JSON.parse(event.data) as SignalingMessage
        this.handleMessage(peerId, data)
      } catch {
        // Ignore malformed messages
      }
    })

    const cleanup = () => {
      this.sessions.delete(peerId)
      this.broadcast({ type: 'peer-left', peerId }, peerId)
    }

    server.addEventListener('close', cleanup)
    server.addEventListener('error', cleanup)

    return new Response(null, { status: 101, webSocket: client })
  }

  private handleMessage(fromPeerId: string, data: SignalingMessage): void {
    const { type, targetPeerId, ...rest } = data

    if (!targetPeerId) return

    switch (type) {
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        const target = this.sessions.get(targetPeerId)
        if (target) {
          target.ws.send(
            JSON.stringify({
              type,
              fromPeerId,
              ...rest,
            })
          )
        }
        break
      }
    }
  }

  private broadcast(
    message: Record<string, unknown>,
    excludePeerId: string
  ): void {
    const msg = JSON.stringify(message)

    for (const [id, session] of this.sessions) {
      if (id !== excludePeerId) {
        try {
          session.ws.send(msg)
        } catch {
          this.sessions.delete(id)
        }
      }
    }
  }
}
