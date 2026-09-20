// Define log levels
export enum LogLevel {
    None = -1,
    Debug = 0,
    Information = 1,
    Event = 2,
    Warning = 3,
    Error = 4,
    Fatal = 5
}

// Define log event type
export class LogEvent {
    constructor(public level: LogLevel, public message: string) {
    }
}

// Define the logging system
export class Log {
    private static sinks: ILogSink[] = [];

    public static addSink(sink: ILogSink): void {
        this.sinks.push(sink);
    }
    /** Replaces sinks of the same type as the given one (e.g. the chat sink), keeping the others. */
    public static replaceSinks(sink: ILogSink): void {
        this.sinks = this.sinks.filter(existing => existing.constructor !== sink.constructor);
        this.sinks.push(sink);
    }

    /** Flushes sinks that buffer (the file sink). */
    public static flush(): void {
        for (const sink of this.sinks) {
            sink.flush?.();
        }
    }

    public static write(level: LogLevel, message: string): void {
        const event = new LogEvent(level, message);
        this.sinks.forEach(sink => {
            if (sink.isEnabled(level)) {
                sink.emit(event);
            }
        });
    }

    // Shortcut methods for each log level
    public static Debug(message: string): void {
        this.write(LogLevel.Debug, message);
    }

    public static Info(message: string): void {
        this.write(LogLevel.Information, message);
    }

    public static Warning(message: string): void {
        this.write(LogLevel.Warning, message);
    }
    public static Event(id: number, message: string): void {
        this.write(LogLevel.Event, `{"event":${id}, "data": ${message}}`);
    }

    public static Error(message: string): void {
        this.write(LogLevel.Error, message);
    }

    public static Fatal(message: string): void {
        this.write(LogLevel.Fatal, message);
    }
}

// Define the log sink interface
export interface ILogSink {
    isEnabled(level: LogLevel): boolean;

    emit(event: LogEvent): void;

    flush?(): void;
}
