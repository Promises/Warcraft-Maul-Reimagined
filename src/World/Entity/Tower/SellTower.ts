import * as settings from '../../GlobalSettings';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Log} from '../../../lib/Serilog/Serilog';
import {Defender} from '../Players/Defender';
import {Maze, Walkable} from '../../Antiblock/Maze';
import {Tower} from './Specs/Tower';
import {AntiJuggleTower} from '../AntiJuggle/AntiJuggleTower';
import {Effect, Trigger, Unit} from "w3ts";
import {Util} from "../../../lib/translators";

export class SellTower {
    private _sellTrigger: Trigger;
    private _game: WarcraftMaul;

    constructor(game: WarcraftMaul) {
        this._game = game;
        this._sellTrigger = Trigger.create();
        TriggerRegisterAnyUnitEventBJ(this._sellTrigger.handle, EVENT_PLAYER_UNIT_SPELL_EFFECT);
        this._sellTrigger.addCondition(() => this.AreWeSellingTheTower());
        this._sellTrigger.addAction(() => this.FindAndSellTower());
    }

    private AreWeSellingTheTower(): boolean {
        return GetSpellAbilityId() === FourCC('A02D');
    }


    public SellTower(unit: Unit): void {
        let playerSpawnId: undefined | number;


        let value: number = unit.pointValue;

        for (let i: number = 0; i < this._game.mapSettings.PLAYER_AREAS.length; i++) {
            if (this._game.mapSettings.PLAYER_AREAS[i].ContainsUnit(unit)) {
                playerSpawnId = i;
                break;
            }
        }

        if (playerSpawnId === undefined) {
            Log.Fatal('Unable to locate the correct player spawn');
            return;
        }

        const owningPlayer = unit.owner;
        const player: Defender | undefined = this._game.players.get(owningPlayer.id);
        if (player) {
            const tower: Tower | undefined = player.GetTower(unit.id);
            if (tower) {

                value = Math.floor((<Tower>tower).GetSellValue());

                if (tower.GetTypeID() !== FourCC('n01Y') &&
                    tower.GetTypeID() !== FourCC('n00M') &&
                    tower.GetTypeID() !== FourCC('e00L')) {
                    value = Util.Round(value * 0.75);
                }

                tower.Sell();
            }
            if (!(unit.getAbilityLevel(FourCC('A02D')) > 0)) {
                value = 0;
            }
            (<Defender>player).giveGold(value);


            // if (GetOwningPlayer(unit) === GetLocalPlayer()) {
            // }
            const txt: texttag = CreateTextTagUnitBJ(`${value}`, unit.handle, 1, 10, 100, 80.00, 0.00, 0)!;

            SetTextTagPermanentBJ(txt, false);
            SetTextTagLifespanBJ(txt, 2.00);
            SetTextTagVelocityBJ(txt, 64, 90);
            const effect = Effect.create('Abilities\\Spells\\Items\\ResourceItems\\ResourceEffectTarget.mdl',
                unit.x,
                unit.y)
            effect?.destroy();
            PlaySoundOnUnitBJ(settings.Sounds.goldSound.handle, 100, unit.handle);
            // }
            //
            const isWaveInProgress: boolean =
                this._game.worldMap.gameRoundHandler ? this._game.worldMap.gameRoundHandler.isWaveInProgress : false;
            const x: number = unit.x;
            const y: number = unit.y;
            // TODO: FIX ANTI-JUGGLE
            if (isWaveInProgress && tower) {
                const antijuggle: AntiJuggleTower = new AntiJuggleTower(this._game, tower);
            } else {
                Log.Debug('Setting maze');


                const maze: Maze = this._game.worldMap.playerMazes[<number>playerSpawnId];
                const leftSide: number = ((x - 64) - maze.minX) / 64;
                const rightSide: number = (x - maze.minX) / 64;
                const topSide: number = (y - maze.minY) / 64;
                const bottomSide: number = ((y - 64) - maze.minY) / 64;
                maze.setWalkable(leftSide, bottomSide, Walkable.Walkable);
                maze.setWalkable(rightSide, bottomSide, Walkable.Walkable);
                maze.setWalkable(leftSide, topSide, Walkable.Walkable);
                maze.setWalkable(rightSide, topSide, Walkable.Walkable);
                unit.destroy();
            }
        }


    }

    private FindAndSellTower(): void {
        const unit = Unit.fromEvent();
        this.SellTower(unit!);

    }
}
