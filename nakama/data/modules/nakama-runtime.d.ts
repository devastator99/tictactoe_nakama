// Type definitions for nakama-runtime
// This is a minimal declaration to resolve TypeScript errors

declare module 'nakama-runtime' {
  export interface Context {
    // Add properties as needed
    [key: string]: any;
  }

  export interface Logger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  }

  export interface Nakama {
    // Add methods as needed
    [key: string]: any;
  }

  export interface MatchCreate {
    (ctx: Context, logger: Logger, nk: Nakama, params: any): any;
  }

  export interface MatchJoinAttempt {
    (ctx: Context, logger: Logger, nk: Nakama, dispatcher: any, tick: number, state: any, presence: any, metadata: any): boolean;
  }

  export interface MatchJoin {
    (ctx: Context, logger: Logger, nk: Nakama, dispatcher: any, tick: number, state: any, presences: any[]): any;
  }

  export interface MatchLeave {
    (ctx: Context, logger: Logger, nk: Nakama, dispatcher: any, tick: number, state: any, presences: any[]): any;
  }

  export interface MatchLoop {
    (ctx: Context, logger: Logger, nk: Nakama, dispatcher: any, tick: number, state: any, messages: any[]): any;
  }

  export interface MatchTerminate {
    (ctx: Context, logger: Logger, nk: Nakama, dispatcher: any, tick: number, state: any, graceSeconds: number): any;
  }

  export interface InitModule {
    (ctx: Context, logger: Logger, nk: Nakama, initializer: any): void;
  }
}