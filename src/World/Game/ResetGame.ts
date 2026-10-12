import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {AbstractGameRound} from './BaseMaul/AbstractGameRound';
import {ClassicGameRound} from './ClassicMaul/ClassicGameRound';
import {BlitzGameRound} from './BlitzMaul/BlitzGameRound';
import {DebugGameRound} from './DebugMaul/DebugGameRound';
import {SendMessage} from '../../lib/translators';
import {SyncTrace} from '../../lib/SyncTrace';

/**
 * -resetgame (debug only): the game as it was just after the settings, in the mode and at the
 * difficulty it has. Every creep is removed and the round starts over at wave 1 with its timer (a
 * fresh round of the same mode: the old one's triggers are off and a wave it was spawning stops),
 * lives are back to their start, every player's towers and units are gone (but for the allow tower)
 * with the lanes' mazes open, gold and lumber are what a game starts with, no race is picked, and
 * the race picker is open. A chat command runs on every client, so all of it stays in step.
 */
export function resetGame(game: WarcraftMaul, by: Defender): void {
    const worldMap = game.worldMap;
    const old: AbstractGameRound | undefined = worldMap.gameRoundHandler;
    old?.retire();

    if (worldMap.spawnedCreeps) {
        worldMap.spawnedCreeps.unitMap.forEach(creep => RemoveUnit(creep.unit.handle));
        worldMap.spawnedCreeps.unitMap.clear();
    }
    for (const player of game.players.values()) {
        player.resetForNewGame();
    }
    for (const maze of worldMap.playerMazes) {
        maze.Reset();
    }

    // The lives a game starts with: one at Extreme, as the difficulty gave them (-lives changes the start too)
    game.startLives = game.diffVote.difficulty >= 400 ? 1 : game.mapSettings.INITIAL_LIVES;
    game.gameLives = game.startLives;
    game.gameTime = 0;
    game.waveTimer = game.mapSettings.GAME_TIME_BEFORE_START;
    // A fresh round of the same mode (Debug is a Classic one, so it is asked first); Debug's sets its timer to 0
    worldMap.gameRoundHandler = old instanceof DebugGameRound ? new DebugGameRound(game)
        : old instanceof BlitzGameRound ? new BlitzGameRound(game) : new ClassicGameRound(game);
    if (game.scoreBoard) {
        MultiboardSetItemValueBJ(game.scoreBoard.board, 1, 1, 'Next wave');
        MultiboardSetItemValueBJ(game.scoreBoard.board, 2, 2, '1');
        MultiboardSetItemValueBJ(game.scoreBoard.board, 2, 4, `${game.gameLives}%`);
    }
    for (const player of game.players.values()) {
        game.raceSelectPanel.open(player);
    }
    SyncTrace.note('reset', `p${by.id} wave=1 lives=${game.gameLives}`);
    SendMessage(`${by.getNameWithColour()} reset the game: wave 1, starting gold, pick your race again`);
}
