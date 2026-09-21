import { Maze, Walkable } from '../../Antiblock/Maze';
import * as settings from '../../GlobalSettings';
import { Log } from '../../../lib/Serilog/Serilog';
import { WarcraftMaul } from '../../WarcraftMaul';
import { Tower } from '../Tower/Specs/Tower';
import {Destructable} from "w3ts";

/** Pathing blocker used for anti-juggle; a stock invisible blocker unless given a model. */
const ANTI_JUGGLE_BLOCKER = 'YTpc';

// The blocker is shown as a circle of power on a red 2x2 pathing footprint. This lived in the
// map's object data before and was lost on a World Editor save, so it is applied at build time.
compiletime(({objectData}) => {
    // Evaluated in isolation at build time: module constants are not in scope here
    const blocker = objectData.destructables.get('YTpc');
    if (!blocker) {
        throw new Error('Anti-juggle blocker YTpc not found in object data');
    }
    blocker.modelFile = 'buildings\\other\\CircleOfPower\\CircleOfPower.mdl';
    blocker.pathingTexture = 'PathTextures\\4x4red.tga';
});

export class AntiJuggleTower {

    private readonly x: number;
    private readonly y: number;
    private readonly leftSide: number = 0;
    private readonly rightSide: number = 0;
    private readonly topSide: number = 0;
    private readonly bottomSide: number = 0;
    private readonly game: WarcraftMaul;
    private destructable: Destructable | undefined;

    constructor(game: WarcraftMaul, tower: Tower) {
        this.game = game;
        // super(tower, owner, game);
        this.x = tower.unit.x;
        this.y = tower.unit.y;
        this.destructable = Destructable.create(FourCC(ANTI_JUGGLE_BLOCKER), this.x, this.y, bj_UNIT_FACING, 1, 1)!;

        let playerSpawnId: undefined | number;
        for (let i: number = 0; i < this.game.mapSettings.PLAYER_AREAS.length; i++) {
            if (this.game.mapSettings.PLAYER_AREAS[i].ContainsDestructable(this.destructable)) {
                playerSpawnId = i;
                break;
            }
        }

        if (playerSpawnId === undefined) {
            Log.Error('Unable to locate the correct player spawn');
            return;
        }
        const maze: Maze = this.game.worldMap.playerMazes[playerSpawnId];
        maze.AddAntiJuggler(this);
        this.leftSide = ((this.x - 64) - maze.minX) / 64;
        this.rightSide = (this.x - maze.minX) / 64;
        this.topSide = (this.y - maze.minY) / 64;
        this.bottomSide = ((this.y - 64) - maze.minY) / 64;


        maze.setWalkable(this.leftSide, this.bottomSide, Walkable.Protected);
        maze.setWalkable(this.rightSide, this.bottomSide, Walkable.Protected);
        maze.setWalkable(this.leftSide, this.topSide, Walkable.Protected);
        maze.setWalkable(this.rightSide, this.topSide, Walkable.Protected);
        tower.unit.destroy();

    }

    public EndOfRoundAction(): void {
        this.destructable?.destroy();
        this.destructable = undefined;
    }

    /**
     * Lifts the blocker so a tower can be built on exactly its footprint: the blocker's
     * pathing refuses build orders. The cells stay Protected until the construction marks
     * them Blocked; restore() puts the blocker back if the build never happens.
     */
    public release(): void {
        this.destructable?.destroy();
        this.destructable = undefined;
    }

    public restore(): void {
        if (!this.destructable) {
            this.destructable = Destructable.create(FourCC(ANTI_JUGGLE_BLOCKER), this.x, this.y, bj_UNIT_FACING, 1, 1);
        }
    }

    /** Whether this blocker sits exactly on a tower footprint centred on (x, y). */
    public isAt(x: number, y: number): boolean {
        return this.x === x && this.y === y;
    }

    public GetX(): number {
        return this.x;
    }

    public GetY(): number {
        return this.y;
    }
}
