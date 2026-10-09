import { FrontmostTower } from '../../Specs/FrontmostTower';

/**
 * Its frost attack: Workers Union's (A0EU, from the game's Frost Attack, Afr2), copied as AC01 to
 * reach ground units as well - A0EU's targets are air only. One buff, refreshed by every hit, so
 * any number of Cold Towers slow a creep as much as one does.
 */
export const COLD_FROST = compiletime(({objectData}) => {
    require(require('path').resolve('scripts/copy-abilities.js')).copyAbilities([
        {from: 'A0EU', id: 'AC01', data: {atar: 'air,enemies,ground'}, skin: {anam: 'Frost Attack'}},
    ]);
    const tower = objectData.units.get('h04B')!;
    tower.normal = String(tower.normal ?? '').split(',').filter(id => id !== '' && id !== 'AC01').concat('AC01').join(',');
    return 'AC01';
}) as string;

/** Always attacks the creep in range furthest along the path (FrontmostTower), and slows it with its frost. */
export class ColdTower extends FrontmostTower {
}
