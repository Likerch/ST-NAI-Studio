// Token lookup: SillyTavern secrets of the requesting user first, then the plugin's own config.
// The token is never sent to the client, not even partially.

export const NOVEL_SECRET_KEY = 'api_key_novel';

/**
 * @param {{secrets: {readSecret: Function} | null, config: {token?: string}}} deps
 * @returns {(req: any) => {token: string | null, source: 'st-secrets' | 'config' | 'none'}}
 */
export function createTokenReader({ secrets, config }) {
    return (req) => {
        if (secrets && req?.user?.directories) {
            try {
                const value = secrets.readSecret(req.user.directories, NOVEL_SECRET_KEY);
                if (value) return { token: value, source: 'st-secrets' };
            } catch {
                // unreadable secrets file: fall through to config
            }
        }
        if (config?.token) return { token: config.token, source: 'config' };
        return { token: null, source: 'none' };
    };
}
