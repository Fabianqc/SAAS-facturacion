import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      lazyConnect: true,
      retryStrategy: (times) => {
        // Intentar reconectar máximo 3 veces de forma silenciosa para no bloquear en desarrollo sin Redis
        if (times > 3) {
          this.logger.warn('⚠️ No se pudo conectar a Redis. La app continuará funcionando sin caché.');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`⚠️ Advertencia Redis (${host}:${port}): ${err.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Error guardando en Redis key ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Error eliminando key de Redis ${key}: ${err.message}`);
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
