import {Timer,MapPlayer, Trigger, Unit} from "w3ts";
import {Players} from "w3ts/globals";
import {W3TS_HOOK, addScriptHook} from "w3ts/hooks";
import {PatchNatives} from "./JassOverrides/NativePatcher";
import {Log, LogLevel} from "./lib/Serilog/Serilog";
import {StringSink} from "./lib/Serilog/Sinks/StringSink";
import {CreepAbilityHandler} from "./World/Entity/CreepAbilities/CreepAbilityHandler";
import {WarcraftMaul} from "./World/WarcraftMaul";
import {SendMessageUnlogged} from "./lib/translators";

const BUILD_DATE = compiletime(() => new Date().toUTCString());
const TS_VERSION = compiletime(() => require("typescript").version);
const TSTL_VERSION = compiletime(() => require("typescript-to-lua").version);

compiletime(({objectData, constants}) => {
    const unit = objectData.units.get(constants.units.Footman);

    if (!unit) {
        return;
    }

    unit.modelFile = "units\\human\\TheCaptain\\TheCaptain.mdl";

    objectData.save();
});

function tsMain() {
    PatchNatives();
    BlzLoadTOCFile('uiImport\\Templates.toc');
    Log.Init([
        new StringSink(LogLevel.Warning, SendMessageUnlogged),
        // new PreloadSink(LogLevel.Message, `WCMAUL\\${os.time()}.txt`),
    ]);
    try {
        // print(`Build: ${BUILD_DATE}`);
        // print(`Typescript: v${TS_VERSION}`);
        // print(`Transpiler: v${TSTL_VERSION}`);
        // print(" ");
        // print("Welcome to TypeScript! TEST2");
        //
        // const unit = new Unit(Players[0], FourCC('hC07'), 0, 0, 270);
        //
        // new Timer().start(1.0, true, () => {
        //     unit.color = Players[math.random(0, bj_MAX_PLAYERS)].color;
        // });
        InitGame.run();

    } catch (e) {
        print(e);
    }
}

export class InitGame {


    private static Main(this: void, creepAbilityHandler: CreepAbilityHandler/*, mmd: MMD*/): void {
        const maul: WarcraftMaul = new WarcraftMaul(creepAbilityHandler/*, mmd*/);
        if (maul.debugMode) {
            Log.Information('Initialisation finished');
        }
    }

    public static run(): void {
        // require('LuaModules.TimerUtils'); // non leaking timers
        // require('app/src/LuaModules/PolledWait'); // proper wait
        // require('LuaModules.FastTriggers'); // 16x faster triggers

        const creepAbilityHandler = this.SetupAbilities();

        xpcall(() => {
            const init: Trigger = Trigger.create();
            init.registerTimerEvent(0.00, false);
            init.addAction(() => InitGame.Main(creepAbilityHandler/*, mmd*/));
        }, (err) => {
            Log.Fatal(err);
        });
    }


    private static SetupAbilities(): CreepAbilityHandler {
        // Setup Sacrifical lamb
        const abilityUnit = Unit.create(MapPlayer.fromIndex(bj_PLAYER_NEUTRAL_EXTRA)!, FourCC('h00L'), 0, 0, 0);
        if (!abilityUnit) {
            throw new Error("Failed to create abilityUnit")
        }

        const creepAbilityHandler: CreepAbilityHandler = new CreepAbilityHandler(abilityUnit);
        abilityUnit.destroy();
        return creepAbilityHandler;
    }
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain);
