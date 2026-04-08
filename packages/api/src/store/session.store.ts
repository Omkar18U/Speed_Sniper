// packages/api/src/store/session.store.ts
import { Session } from '../models/types';
import Redis from 'ioredis';

export interface ISessionStore {
  get(id: string): Promise<Session | undefined>;
  set(id: string, session: Session): Promise<void>;
  delete(id: string): Promise<boolean>;
  prune(): Promise<void>;
  size(): Promise<number>;
}

export class InMemorySessionStore implements ISessionStore {
  private sessions: Map<string, Session> = new Map();

  constructor(private ttlMinutes: number = 30) {}

  async get(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async set(id: string, session: Session): Promise<void> {
    this.sessions.set(id, {
      ...session,
      lastActivityAt: Date.now()
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async prune(): Promise<void> {
    const now = Date.now();
    const ttlMs = this.ttlMinutes * 60 * 1000;
    
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > ttlMs) {
        this.sessions.delete(id);
        console.log(`Pruned inactive session: ${id}`);
      }
    }
  }

  async size(): Promise<number> {
    return this.sessions.size;
  }
}

export class RedisSessionStore implements ISessionStore {
  private redis: Redis;

  constructor(private ttlMinutes: number = 30, redisUrl?: string) {
    this.redis = redisUrl ? new Redis(redisUrl) : new Redis();
  }

  async get(id: string): Promise<Session | undefined> {
    const data = await this.redis.get(`session:${id}`);
    if (!data) return undefined;
    return JSON.parse(data);
  }

  async set(id: string, session: Session): Promise<void> {
    const updated = {
      ...session,
      lastActivityAt: Date.now()
    };
    await this.redis.set(
      `session:${id}`,
      JSON.stringify(updated),
      'EX',
      this.ttlMinutes * 60
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.redis.del(`session:${id}`);
    return result > 0;
  }

  async prune(): Promise<void> {
    // Redis handles TTL automatically via 'EX'
  }

  async size(): Promise<number> {
    const keys = await this.redis.keys('session:*');
    return keys.length;
  }
}

const ttl = Number(process.env.SESSION_TTL_MINUTES) || 30;
export const store: ISessionStore = process.env.USE_REDIS === 'true'
  ? new RedisSessionStore(ttl, process.env.REDIS_URL)
  : new InMemorySessionStore(ttl);
