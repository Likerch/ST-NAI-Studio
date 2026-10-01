// Transport selection with degradation (RECON §4, decision P-3: only plugin and native).
import { createNativeTransport } from './st-native';
import { createPluginTransport, probePlugin } from './plugin';
import type { PluginHealth } from './plugin';
import type { Transport, TransportEnv } from './types';

export type TransportPreference = 'auto' | 'plugin' | 'native';

export interface TransportSelection {
    transport: Transport;
    health: PluginHealth | null;
    /** The preferred transport was unavailable and another one was chosen. */
    degraded: boolean;
}

export async function selectTransport(
    preference: TransportPreference,
    env: TransportEnv,
    signal?: AbortSignal,
): Promise<TransportSelection> {
    const health = await probePlugin(env, signal);
    if (preference === 'native') {
        return { transport: createNativeTransport(env), health, degraded: false };
    }
    if (health) {
        return { transport: createPluginTransport(env), health, degraded: false };
    }
    if (preference === 'plugin') {
        // Explicit choice: keep the plugin so the user sees why it fails instead of a silent switch.
        return { transport: createPluginTransport(env), health: null, degraded: false };
    }
    return { transport: createNativeTransport(env), health: null, degraded: true };
}

export * from './types';
export { PLUGIN_BASE, PLUGIN_ID, PLUGIN_FEATURES, probePlugin } from './plugin';
export type { PluginHealth } from './plugin';
export { NATIVE_FEATURES, lostOnNative, stEffectiveBody, toStNativeRequest } from './st-native';
