/**
 * The frost attack that reaches ground units: Workers Union's (A0EU, from the game's Frost Attack,
 * Afr2) targets air only, so it is copied at build time as AC01 with ground added. The Cold Tower
 * (h04B) gets it, and the Undead Acolyte (h03I) has it in place of A0EU - the Acolyte attacks
 * ground only, so its A0EU could never slow anything. One buff, refreshed by every hit, so any
 * number of towers slow a creep as much as one does.
 */
export const GROUND_FROST = compiletime(({objectData}) => {
    require(require('path').resolve('scripts/copy-abilities.js')).copyAbilities([
        {from: 'A0EU', id: 'AC01', data: {atar: 'air,enemies,ground'}, skin: {anam: 'Frost Attack'}},
    ]);
    for (const id of ['h04B', 'h03I']) {
        const tower = objectData.units.get(id)!;
        tower.normal = String(tower.normal ?? '').split(',').filter(a => a !== '' && a !== 'A0EU' && a !== 'AC01')
            .concat('AC01').join(',');
    }
    return 'AC01';
}) as string;
