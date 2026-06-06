import { createScopedLogger } from '~/utils/logger';
import { collaborators, isCollaborating, generateColor, type Collaborator } from '~/lib/stores/collaboration';

const logger = createScopedLogger('CollaborationService');

type CollabMessage =
  | { type: 'presence'; userId: string; name: string; color: string; role: string }
  | { type: 'presence-request'; userId: string }
  | { type: 'presence-response'; userId: string; name: string; color: string; role: string }
  | { type: 'cursor'; userId: string; name: string; color: string; cursor: { line: number; col: number; file: string } }
  | { type: 'file-change'; userId: string; path: string; content: string }
  | { type: 'file-delete'; userId: string; path: string }
  | { type: 'snapshot-request'; userId: string }
  | { type: 'snapshot-response'; userId: string; files: Record<string, any> };

class CollaborationService {
  private _channel: BroadcastChannel | null = null;
  private _userId: string = '';
  private _userName: string = '';
  private _userColor: string = '';
  private _userRole: 'admin' | 'editor' | 'viewer' = 'editor';
  private _chatId: string = '';
  private _knownCollaborators: Map<string, Collaborator> = new Map();

  private _onFileChange: ((path: string, content: string) => void) | null = null;
  private _onFileDelete: ((path: string) => void) | null = null;
  private _onSnapshotRequest: (() => Record<string, any> | undefined) | null = null;

  private _heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private _cleanupInterval: ReturnType<typeof setInterval> | null = null;

  get isConnected(): boolean {
    return this._channel !== null;
  }

  connect(chatId: string, userId: string, userName: string, role: 'admin' | 'editor' | 'viewer' = 'editor') {
    if (this._channel) {
      this.disconnect();
    }

    this._chatId = chatId;
    this._userId = userId;
    this._userName = userName;
    this._userRole = role;
    this._knownCollaborators.clear();

    const colorIndex = Math.abs(this._hashString(userId)) % 12;
    this._userColor = generateColor(colorIndex);

    try {
      this._channel = new BroadcastChannel(`supercode-collab-${chatId}`);

      this._channel.onmessage = (event: MessageEvent) => {
        this._handleMessage(event.data);
      };

      // Broadcast our presence
      this.broadcast({
        type: 'presence',
        userId,
        name: userName,
        color: this._userColor,
        role,
      });

      // Request existing collaborators to respond
      this.broadcast({
        type: 'presence-request',
        userId,
      });

      isCollaborating.set(true);

      // Heartbeat to keep presence alive
      this._heartbeatInterval = setInterval(() => {
        this.broadcast({
          type: 'presence',
          userId,
          name: userName,
          color: this._userColor,
          role,
        });
      }, 15000);

      // Clean up stale collaborators (no heartbeat in 45 seconds)
      this._cleanupInterval = setInterval(() => {
        const now = Date.now();
        const staleTimeout = 45000;
        let hasChanges = false;

        this._knownCollaborators.forEach((collab, id) => {
          if (id !== userId && now - collab.lastSeen > staleTimeout) {
            this._knownCollaborators.delete(id);
            hasChanges = true;
            logger.info(`Removed stale collaborator: ${collab.name}`);
          }
        });

        if (hasChanges) {
          this._emitPresenceUpdate();
        }
      }, 10000);

      logger.info(`Collaboration connected for chat: ${chatId} as ${userName}`);
    } catch (error) {
      logger.error('Failed to connect collaboration channel', error);
    }
  }

  disconnect() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }

    if (this._channel) {
      this._channel.close();
      this._channel = null;
    }

    this._knownCollaborators.clear();
    isCollaborating.set(false);
    collaborators.set([]);

    logger.info('Collaboration disconnected');
  }

  broadcast(message: CollabMessage) {
    if (!this._channel) {
      return;
    }

    try {
      this._channel.postMessage(message);
    } catch (error) {
      logger.error('Failed to broadcast message', error);
    }
  }

  broadcastCursor(cursor: { line: number; col: number; file: string }) {
    this.broadcast({
      type: 'cursor',
      userId: this._userId,
      name: this._userName,
      color: this._userColor,
      cursor,
    });
  }

  broadcastFileChange(path: string, content: string) {
    this.broadcast({
      type: 'file-change',
      userId: this._userId,
      path,
      content,
    });
  }

  broadcastFileDelete(path: string) {
    this.broadcast({
      type: 'file-delete',
      userId: this._userId,
      path,
    });
  }

  onFileChangeReceived(cb: (path: string, content: string) => void) {
    this._onFileChange = cb;
  }

  onFileDeleteReceived(cb: (path: string) => void) {
    this._onFileDelete = cb;
  }

  onSnapshotRequested(cb: () => Record<string, any> | undefined) {
    this._onSnapshotRequest = cb;
  }

  private _handleMessage(msg: CollabMessage) {
    switch (msg.type) {
      case 'presence': {
        // Don't process our own presence messages
        if (msg.userId === this._userId) {
          return;
        }

        this._knownCollaborators.set(msg.userId, {
          id: msg.userId,
          name: msg.name,
          color: msg.color,
          role: msg.role as Collaborator['role'],
          lastSeen: Date.now(),
        });

        this._emitPresenceUpdate();
        break;
      }

      case 'presence-request': {
        // Someone new joined, respond with our presence
        if (msg.userId === this._userId) {
          return;
        }

        this.broadcast({
          type: 'presence-response',
          userId: this._userId,
          name: this._userName,
          color: this._userColor,
          role: this._userRole,
        });
        break;
      }

      case 'presence-response': {
        // Another tab responded to our presence request
        if (msg.userId === this._userId) {
          return;
        }

        this._knownCollaborators.set(msg.userId, {
          id: msg.userId,
          name: msg.name,
          color: msg.color,
          role: msg.role as Collaborator['role'],
          lastSeen: Date.now(),
        });

        this._emitPresenceUpdate();
        break;
      }

      case 'cursor': {
        if (msg.userId === this._userId) {
          return;
        }

        const existing = this._knownCollaborators.get(msg.userId);

        if (existing) {
          this._knownCollaborators.set(msg.userId, {
            ...existing,
            lastSeen: Date.now(),
            cursor: msg.cursor,
          });
          this._emitPresenceUpdate();
        }

        break;
      }

      case 'file-change': {
        if (msg.userId === this._userId) {
          return;
        }

        logger.info(`File change received from ${msg.userId}: ${msg.path}`);
        this._onFileChange?.(msg.path, msg.content);
        break;
      }

      case 'file-delete': {
        if (msg.userId === this._userId) {
          return;
        }

        logger.info(`File delete received from ${msg.userId}: ${msg.path}`);
        this._onFileDelete?.(msg.path);
        break;
      }

      case 'snapshot-request': {
        if (!this._onSnapshotRequest) {
          return;
        }

        const files = this._onSnapshotRequest();

        if (files) {
          this.broadcast({
            type: 'snapshot-response',
            userId: this._userId,
            files,
          });
        }

        break;
      }

      case 'snapshot-response': {
        // Files snapshot response - handled by the caller
        logger.info(`Snapshot response received from ${msg.userId}`);
        break;
      }
    }
  }

  private _emitPresenceUpdate() {
    const collabList = Array.from(this._knownCollaborators.values());
    collaborators.set(collabList);
  }

  private _hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash * 31 + char) | 0; // Use bitwise OR for 32-bit integer
    }

    return hash;
  }

  /**
   * Request a snapshot of all files from the current (admin) collaborator
   */
  requestSnapshot() {
    this.broadcast({
      type: 'snapshot-request',
      userId: this._userId,
    });
  }

  /**
   * Send a snapshot response with file data
   */
  sendSnapshot(files: Record<string, any>) {
    this.broadcast({
      type: 'snapshot-response',
      userId: this._userId,
      files,
    });
  }
}

export const collaborationService = new CollaborationService();
