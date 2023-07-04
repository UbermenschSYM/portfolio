import { Storage, createStorage, StorageValue, Driver } from 'unstorage';
import fsDriver from 'unstorage/drivers/fs';
import mongodbDriver from 'unstorage/drivers/mongodb';
import redisDriver from 'unstorage/drivers/redis';

import { NetworkIdType } from './Network';

export type TransactionOptions = {
  prefix: string;
  networkId?: NetworkIdType;
  ttl?: number;
};
const ttlPrefix = 'ttl';

export class Cache {
  private readonly storage: Storage;

  constructor(driver: Driver) {
    this.storage = createStorage({
      driver,
    });
  }

  async hasItem(key: string, opts: TransactionOptions) {
    const item = await this.getItem(key, opts);
    return item !== undefined;
  }

  async getItem<K extends StorageValue>(
    key: string,
    opts: TransactionOptions
  ): Promise<K | undefined> {
    const fullKey = getFullKey(key, opts);
    const ttl = await this.getItem<number>(fullKey, {
      prefix: ttlPrefix,
    });
    if (ttl && ttl < Date.now()) {
      await this.removeItem(key, opts);
      return undefined;
    }
    return this.storage.getItem(fullKey) as Promise<K | undefined>;
  }

  async setItem<K extends StorageValue>(
    key: string,
    value: K,
    opts: TransactionOptions
  ) {
    const fullKey = getFullKey(key, opts);
    if (opts.ttl) {
      await this.setItem(fullKey, Date.now() + opts.ttl, {
        prefix: ttlPrefix,
      });
    }
    return this.storage.setItem(fullKey, value);
  }

  async removeItem(key: string, opts: TransactionOptions) {
    const fullKey = getFullKey(key, opts);
    await this.removeItem(fullKey, {
      prefix: ttlPrefix,
    });
    return this.storage.removeItem(fullKey);
  }

  async getKeys(opts: TransactionOptions) {
    const fullBase = getFullBase(opts);
    return (await this.storage.getKeys(fullBase)).map((s) =>
      s.substring(fullBase.length)
    );
  }

  dispose() {
    return this.storage.dispose();
  }
}

function getFullKey(key: string, opts: TransactionOptions): string {
  const { networkId, prefix } = opts;
  const networkIdKeyPrefix = networkId ? `/${networkId.toString()}` : '';
  return `/${prefix}${networkIdKeyPrefix}/${key}`;
}

function getFullBase(opts: TransactionOptions) {
  const { networkId, prefix } = opts;
  const networkIdBasePrefix = networkId ? `${networkId.toString()}:` : '';
  const fullBase = `${prefix}:${networkIdBasePrefix}`;
  return fullBase;
}

function getDriver(): Driver {
  switch (process.env['CACHE_DRIVER']) {
    case 'filesystem':
      return fsDriver({
        base: process.env['CACHE_FILESYSTEM_BASE']
          ? `${process.env['CACHE_FILESYSTEM_BASE']}/main`
          : './cache/main',
      });
    case 'mongodb':
      return mongodbDriver({
        connectionString:
          process.env['CACHE_MONGODB_CONNECTION'] ||
          'mongodb://localhost:27017/',
        databaseName: process.env['CACHE_MONGODB_DATABASE'] || 'portfolio',
        collectionName: 'main',
      });
    case 'redis':
      return redisDriver({
        url: process.env['CACHE_REDIS_URL'] || '127.0.0.1:6379',
        tls: process.env['CACHE_REDIS_TLS'] === 'true' ? {} : undefined,
        base: 'main',
      });
    default:
      return fsDriver({ base: './cache/main' });
  }
}

export function getCache() {
  return new Cache(getDriver());
}
