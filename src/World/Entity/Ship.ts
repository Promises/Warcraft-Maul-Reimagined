import { CheckPoint } from './CheckPoint';
import { WorldMap } from '../WorldMap';
import { WarcraftMaul } from '../WarcraftMaul';
import { Sounds } from '../GlobalSettings';
import { SpawnedCreeps } from './SpawnedCreeps';
import { Creep } from './Creep';
import {Unit} from "w3ts";
import {CREEP_TYPE, SendMessage} from "../../lib/translators";

export class Ship extends CheckPoint {
    private readonly ship: Unit;
    private readonly game: WarcraftMaul;
    public worldMap: WorldMap;

    private readonly destination: rect = Rect(-5440.0, -5664.0, -5184.0, -4864.0); // Ship moves to here when game ends

    // killzone: CheckPoint;

    constructor(ship: Unit, worldMap: WorldMap) {
        super(Rect(-768.00, -4992.00, 768.00, -4800.00), worldMap);
        this.ship = ship;
        this.worldMap = worldMap;
        this.game = this.worldMap.game;

    }

    public MoveShip(): void {
        this.ship.issueOrderAt('move', GetRectCenterX(this.destination), GetRectCenterY(this.destination))
    }

    public CheckPointAction(): void {
        const u = Unit.fromHandle(GetEnteringUnit());
        if(!u) {
            return;
        }
        if (this.game.gameEnded || !this.worldMap.gameRoundHandler) {
            return;
        }
        if (this.worldMap.gameRoundHandler.currentWave >= 36) {
            u.destroy();
        }
        const spawnedCreeps: SpawnedCreeps | undefined = this.worldMap.spawnedCreeps;
        if (spawnedCreeps !== undefined) {
            const creep: Creep | undefined = spawnedCreeps.unitMap.get(u.id);
            if (creep !== undefined) {
                if (creep.getTypeId() === FourCC('uC72')) {
                    SendMessage('Archimonde has boarded the ship! |cFFFF0000YOU LOSE!|r');
                    this.game.gameLives = 0;
                } else {
                    //  this.game.gameLives--;
                    const lifePercent =creep.unit.life / creep.unit.maxLife * 100;
                    if (this.worldMap.waveCreeps[this.worldMap.gameRoundHandler.currentWave - 1].getCreepType() === CREEP_TYPE.CHAMPION) {
                        this.game.gameLives = this.game.gameLives - Math.ceil(lifePercent / 10);
                    } else {
                        this.game.gameLives = this.game.gameLives - Math.ceil(lifePercent / 20);
                    }
                    // SendMessage(
                    //     `|c00ff0000A unit has boarded the ship!|r ${Math.floor(this.game.gameLives)} |c00ff0000chances left|r`);
                    if (this.game.gameLives <= 0) {
                        this.game.gameLives = 0;
                    }

                    SendMessage(
                        `|c00ff0000A unit has boarded the ship!|r ${this.game.gameLives}|c00ff0000% of your lives left|r`);
                }


                creep.targetCheckpoint = undefined;
                spawnedCreeps.unitMap.delete(u.id);
                creep.unit.destroy();
                Sounds.loseALifeSound.start()
                if (this.game.scoreBoard) {
                    MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 4, `${this.game.gameLives}%`);
                    // MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 4, `${this.game.gameLives}`);
                }

                if (this.game.gameLives <= 0) {
                    this.game.GameOver();
                }
            }
        }
    }
}
