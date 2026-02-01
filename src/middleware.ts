import { proxy, config as proxyConfig } from './proxy';

// Re-export the proxy function as middleware
export const middleware = proxy;

// Re-export the config
export const config = proxyConfig;
