/// <reference types="@cloudflare/workers-types" />

import type { Env as CustomEnv } from "./_types";

declare global {
  interface PagesFunction<Env = unknown> {
    (context: EventContext<Env, any, any>): Response | Promise<Response>;
  }

  interface EventContext<Env, P, Data> {
    request: Request;
    functionPath: string;
    waitUntil: (promise: Promise<any>) => void;
    passThroughOnException: () => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    env: Env;
    params: P;
    data: Data;
  }
}

export {};
