import {ILogSink, LogEvent, LogLevel} from '../Serilog';

/**
 * Writes log events to CustomMapData/<fileName> through the Preload file trick, so the
 * log can be read outside the game. The file is rewritten as a whole on every flush, so
 * events are buffered and only written on request (see Log.flush) or on an error.
 * The game only writes whitelisted extensions (use .txt) and each line ends up inside a
 * quoted string, so quotes are replaced.
 */
export class FileSink implements ILogSink {
    private static readonly MAX_LINES = 400;
    private readonly lines: string[] = [];
    private dirty: boolean = false;

    constructor(private readonly fileName: string, private readonly minLevel: LogLevel = LogLevel.Debug) {}

    public isEnabled(level: LogLevel): boolean {
        return level >= this.minLevel;
    }

    public emit(event: LogEvent): void {
        const [message] = string.gsub(event.message, '["\r\n]', "'");
        this.lines.push(`[${LogLevel[event.level]}] ${message}`);
        if (this.lines.length > FileSink.MAX_LINES) {
            this.lines.shift();
        }
        this.dirty = true;
        if (event.level >= LogLevel.Error) {
            this.flush();
        }
    }

    public flush(): void {
        if (!this.dirty) {
            return;
        }
        this.dirty = false;
        PreloadGenClear();
        PreloadGenStart();
        for (const line of this.lines) {
            Preload(line);
        }
        PreloadGenEnd(this.fileName);
    }
}
