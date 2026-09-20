import {ILogSink, LogEvent, LogLevel} from '../Serilog';

/**
 * Writes log events to CustomMapData/<fileName> through the Preload file trick, so the
 * log can be read outside the game. The file is rewritten as a whole on every flush, so
 * events are buffered and only written on request (see Log.flush) or on an error.
 * The game only writes whitelisted extensions (use .txt) and each line ends up inside a
 * quoted string, so quotes are replaced. Lines carry the local wall-clock time: Reforged
 * leaves os.date in the map sandbox (io, debug and package are stripped, os stays).
 */
export class FileSink implements ILogSink {
    private static readonly MAX_LINES = 400;
    private readonly lines: string[] = [];
    private dirty: boolean = false;
    private readonly timestamps: boolean;

    constructor(private readonly fileName: string, private readonly minLevel: LogLevel = LogLevel.Debug) {
        // Checked once rather than assumed, in case a platform strips os as well
        const [available] = pcall(() => os.date('%H:%M:%S'));
        this.timestamps = available;
    }

    public isEnabled(level: LogLevel): boolean {
        return level >= this.minLevel;
    }

    public emit(event: LogEvent): void {
        const [message] = string.gsub(event.message, '["\r\n]', "'");
        const stamp = this.timestamps ? `${os.date('%H:%M:%S')} ` : '';
        this.lines.push(`${stamp}[${LogLevel[event.level]}] ${message}`);
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
