import type { PrismaClient } from '@prisma/client';
import type { BaileysEventEmitter, SocketConfig } from '@whiskeysockets/baileys';
import * as handlers from './handlers';
import { setLogger, setPrisma } from './shared';

type initStoreOptions = {
  /** Prisma client instance */
  prisma: PrismaClient;
  /** Baileys pino logger */
  logger?: SocketConfig['logger'];
};

/** Initialize shared instances that will be consumed by the Store instance */
export function initStore({ prisma, logger }: initStoreOptions) {
  setPrisma(prisma);
  setLogger(logger);
}

export interface StoreOptions {
  /** Whether to store chat data */
  storeChats?: boolean;
  /** Whether to store message data */
  storeMessages?: boolean;
  /** Whether to store contact data */
  storeContacts?: boolean;
}

/** Default store options */
export const defaultStoreOptions: StoreOptions = {
  storeChats: true,
  storeMessages: true,
  storeContacts: true,
};

export class Store {
  private readonly chatHandler;
  private readonly messageHandler;
  private readonly contactHandler;
  private readonly options: StoreOptions;

  constructor(
    sessionId: string,
    event: BaileysEventEmitter,
    options: StoreOptions = defaultStoreOptions,
  ) {
    this.options = { ...defaultStoreOptions, ...options };
    this.chatHandler = handlers.chatHandler(sessionId, event);
    this.messageHandler = handlers.messageHandler(sessionId, event);
    this.contactHandler = handlers.contactHandler(sessionId, event);
    this.listen();
  }

  /** Start listening to the events */
  public listen() {
    if (this.options.storeChats) {
      this.chatHandler.listen();
    }
    if (this.options.storeMessages) {
      this.messageHandler.listen();
    }
    if (this.options.storeContacts) {
      this.contactHandler.listen();
    }
  }

  /** Stop listening to the events */
  public unlisten() {
    if (this.options.storeChats) {
      this.chatHandler.unlisten();
    }
    if (this.options.storeMessages) {
      this.messageHandler.unlisten();
    }
    if (this.options.storeContacts) {
      this.contactHandler.unlisten();
    }
  }
}
