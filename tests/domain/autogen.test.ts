import { describe, expect, it } from 'vitest';
import { autoBudget, evaluateAuto, isSceneChange, matchesKeyword } from '../../src/domain';
import type { AutoRules } from '../../src/domain';

const rules: AutoRules = {
    enabled: true,
    everyMessages: 0,
    keywords: '',
    sceneChange: false,
    sceneMarkers: '***, ---, Meanwhile',
    cooldownMessages: 1,
    cooldownSeconds: 0,
};
const fresh = { messagesSince: 0, lastAt: 0 };

describe('matchesKeyword', () => {
    it('matches whole words case-insensitively, Unicode included', () => {
        expect(matchesKeyword('The Dragon roars', 'sword, dragon')).toBe(true);
        expect(matchesKeyword('a dragonfly', 'dragon')).toBe(false);
        expect(matchesKeyword('Он поднял меч.', 'меч')).toBe(true);
        expect(matchesKeyword('мечта', 'меч')).toBe(false);
        expect(matchesKeyword('look at the night sky', 'night sky')).toBe(true);
        expect(matchesKeyword('anything', ' , ')).toBe(false);
    });

    it('escapes regular expression characters', () => {
        expect(matchesKeyword('price is $5 (cheap)', '(cheap)')).toBe(true);
    });
});

describe('isSceneChange', () => {
    it('symbol markers match anywhere, word markers only at a line start', () => {
        expect(isSceneChange('text\n***\nmore', rules.sceneMarkers)).toBe(true);
        expect(isSceneChange('a---b', rules.sceneMarkers)).toBe(true);
        expect(isSceneChange('Meanwhile, in the castle', rules.sceneMarkers)).toBe(true);
        expect(isSceneChange('end.\n  meanwhile she slept', rules.sceneMarkers)).toBe(true);
        expect(isSceneChange('It was meanwhile ok', rules.sceneMarkers)).toBe(false);
        expect(isSceneChange('nothing here', rules.sceneMarkers)).toBe(false);
    });
});

describe('evaluateAuto', () => {
    it('counts messages but never fires when disabled', () => {
        const decision = evaluateAuto({ ...rules, enabled: false, everyMessages: 1 }, fresh, 'x', 1000);
        expect(decision).toEqual({ fire: false, state: { messagesSince: 1, lastAt: 0 } });
    });

    it('fires on every N-th message and resets the counter', () => {
        const every = { ...rules, everyMessages: 3 };
        let state = fresh;
        const fired: boolean[] = [];
        for (let i = 1; i <= 6; i++) {
            const decision = evaluateAuto(every, state, 'text', i * 1000);
            fired.push(decision.fire);
            state = decision.state;
        }
        expect(fired).toEqual([false, false, true, false, false, true]);
        expect(state).toEqual({ messagesSince: 0, lastAt: 6000 });
    });

    it('reports the rule that matched', () => {
        expect(evaluateAuto({ ...rules, keywords: 'dragon' }, fresh, 'a dragon', 1).reason).toBe('keyword');
        expect(evaluateAuto({ ...rules, sceneChange: true }, fresh, '***', 1).reason).toBe('scene-change');
        expect(evaluateAuto({ ...rules, sceneChange: false }, fresh, '***', 1).fire).toBe(false);
        expect(evaluateAuto({ ...rules, keywords: '  ' }, fresh, 'dragon', 1).fire).toBe(false);
    });

    it('respects the message cooldown after a previous generation', () => {
        const decision = evaluateAuto(
            { ...rules, keywords: 'dragon', cooldownMessages: 3 },
            { messagesSince: 0, lastAt: 1000 },
            'dragon',
            999999,
        );
        expect(decision).toEqual({
            fire: false,
            reason: 'keyword',
            blockedBy: 'cooldown-messages',
            state: { messagesSince: 1, lastAt: 1000 },
        });
    });

    it('respects the time cooldown after a previous generation', () => {
        const timed = { ...rules, keywords: 'dragon', cooldownSeconds: 60 };
        const state = { messagesSince: 5, lastAt: 1000 };
        expect(evaluateAuto(timed, state, 'dragon', 30000).blockedBy).toBe('cooldown-seconds');
        expect(evaluateAuto(timed, state, 'dragon', 61001).fire).toBe(true);
    });

    it('cooldowns do not apply before the first auto generation', () => {
        const decision = evaluateAuto(
            { ...rules, keywords: 'dragon', cooldownMessages: 5, cooldownSeconds: 600 },
            fresh,
            'dragon',
            10,
        );
        expect(decision.fire).toBe(true);
    });
});

describe('autoBudget', () => {
    it('is 0 in free-only mode and without the explicit paid opt-in', () => {
        expect(autoBudget(true, true)).toBe(0);
        expect(autoBudget(true, false)).toBe(0);
        expect(autoBudget(false, false)).toBe(0);
        expect(autoBudget(false, true)).toBe(Number.POSITIVE_INFINITY);
    });
});
