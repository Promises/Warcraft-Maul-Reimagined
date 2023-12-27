import { ILogSink, LogEvent, LogLevel } from "../Serilog";

export class StringSink implements ILogSink {
    private static readonly Colours: Record<LogLevel, string> = {
        [LogLevel.None]: '|cffffffff',
        // [LogLevel.Verbose]: '|cff9d9d9dVRB|r',
        [LogLevel.Debug]: '|cff9d9d9d',
        [LogLevel.Information]: '|cffe6cc80',
        // [LogLevel.Message]: '|cffe6cc80MSG|r',
        [LogLevel.Event]: '|cffe6cc80',
        [LogLevel.Warning]: '|cffffcc00',
        [LogLevel.Error]: '|cffff8000',
        [LogLevel.Fatal]: '|cffff0000',
    }
    constructor(private minLevel: LogLevel = LogLevel.Debug) {}

    public isEnabled(level: LogLevel): boolean {
        return level >= this.minLevel;
    }

    public emit(event: LogEvent): void {
        const colour = StringSink.Colours[event.level];
        print(`${colour}[${LogLevel[event.level].toUpperCase()}]|r ${event.message}`);
    }
}
