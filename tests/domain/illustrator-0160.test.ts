// v0.16 illustrator: the rules blocks of a prompt (cut out in the illustrator mode, given to the illustrator)
// and the place a picture goes after a sentence of the reply.
import { describe, expect, it } from 'vitest';
import { cardMainPassport } from '../../src/features/characters/card-avatar';
import {
    defaultPassport,
    findAnchorEnd,
    hintPose,
    findRulesBlocks,
    insertPictureLine,
    isMarkerWriter,
    MAX_POSE_LENGTH,
    MAX_RULES_BLOCK,
    mergeSceneHints,
    normalizeSceneHint,
    pictureOffset,
    stripRulesBlocks,
} from '../../src/domain';

const RULES = `<images>
Illustrate this reply with 1-3 pictures.
<figure class="story-img">
<img data-nai='{"prompt":"[SCENE]"}'>
<figcaption>A caption.</figcaption>
</figure>
</images>`;

describe('rules blocks', () => {
    it('the innermost non-HTML element around data-nai, inside a squashed system message', () => {
        const text = `<rules>\nBe vivid.\n${RULES}\nNever speak for the user.\n</rules>`;
        const blocks = findRulesBlocks(text);
        expect(blocks).toHaveLength(1);
        expect(blocks[0]!.text).toBe(RULES);
        expect(stripRulesBlocks(text, blocks)).toBe('<rules>\nBe vivid.\n\nNever speak for the user.\n</rules>');
    });

    it('no element around the marker, or one too long: nothing is cut', () => {
        expect(findRulesBlocks(`Use <img data-nai='{"prompt":"x"}'> for pictures.`)).toEqual([]);
        const huge = `<all>${'x'.repeat(MAX_RULES_BLOCK)}<img data-nai='{}'></all>`;
        expect(findRulesBlocks(huge)).toEqual([]);
    });

    it('two blocks; a message of only rules becomes empty', () => {
        const text = `${RULES}\n\n${RULES.replace('1-3', 'one')}`;
        const blocks = findRulesBlocks(text);
        expect(blocks).toHaveLength(2);
        expect(stripRulesBlocks(text, blocks)).toBe('');
    });

    it('writers', () => {
        expect(isMarkerWriter('fallback')).toBe(true);
        expect(isMarkerWriter('model')).toBe(false);
    });
});

describe('where a picture goes', () => {
    const reply = 'Мира входит в зал.\nСвечи гаснут одна за другой, и тьма густеет.\n\nКай молчит.';

    it('after the line the sentence ends in; loose quotes, spacing and case', () => {
        expect(pictureOffset(reply, 'Свечи гаснут одна за другой')).toBe(reply.indexOf('\n\nКай'));
        expect(findAnchorEnd(reply, '«свечи   гаснут одна за другой, и тьма густеет.»')).toBe(reply.indexOf('\n\nКай'));
        // The model changed the end of the sentence: its start is enough.
        expect(pictureOffset(reply, 'Свечи гаснут одна за другой, и темнота сгущается.')).toBe(
            reply.indexOf('\n\nКай'),
        );
    });

    it('unknown or no sentence: the end of the reply', () => {
        expect(pictureOffset(reply, 'Дракон взлетает.')).toBe(reply.length);
        expect(pictureOffset(reply)).toBe(reply.length);
    });

    it('the placeholder goes on its own line', () => {
        const at = pictureOffset(reply, 'Свечи гаснут');
        expect(insertPictureLine(reply, '[nai:img:abcdef]', at)).toBe(
            'Мира входит в зал.\nСвечи гаснут одна за другой, и тьма густеет.\n[nai:img:abcdef]\n\nКай молчит.',
        );
        expect(insertPictureLine('Конец.', '[nai:img:abcdef]', 6)).toBe('Конец.\n[nai:img:abcdef]');
    });
});

describe('poses in scene hints', () => {
    it('kept per name (first wins, cut long), merged by priority, found by any name of the person', () => {
        const hint = normalizeSceneHint({
            poses: [
                { name: 'Mira', pose: 'sitting by the fire' },
                { name: 'mira', pose: 'standing' },
                { name: 'Kai', pose: 'x'.repeat(500) },
                { name: '', pose: 'lying' },
                'nonsense',
            ],
        });
        expect(hint?.poses).toEqual([
            { name: 'Mira', pose: 'sitting by the fire' },
            { name: 'Kai', pose: 'x'.repeat(MAX_POSE_LENGTH) },
        ]);
        expect(normalizeSceneHint({ poses: [] })).toBeNull();
        const merged = mergeSceneHints([{ tags: 'night' }, hint, { poses: [{ name: 'Vera', pose: 'kneeling' }] }]);
        expect(merged.poses?.map((p) => p.name)).toEqual(['Mira', 'Kai']);
        expect(hintPose(merged, ['Мира', 'MIRA'])).toBe('sitting by the fire');
        expect(hintPose(merged, ['Vera'])).toBeUndefined();
    });
});

describe('the card passport an avatar is drawn from', () => {
    it('the card itself, else its first person', () => {
        const card = defaultPassport('character', '', 'main');
        const friend = defaultPassport('character', 'Kai', 'kai');
        const place = defaultPassport('location', 'Inn', 'inn');
        expect(cardMainPassport([place, friend, card])?.id).toBe('main');
        expect(cardMainPassport([place, friend])?.id).toBe('kai');
        expect(cardMainPassport([place])).toBeNull();
    });
});
