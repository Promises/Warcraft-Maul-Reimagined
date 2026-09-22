import * as fs from "fs";
import * as path from "path";

export class Quest {
    title: string;
    icon: string;
    stype: number;
    body: string;

    constructor(title: string, icon: string, stype: number, body: string) {
        this.title = title;
        this.icon = icon;
        this.stype = stype;
        this.body = body;
    }

    toString(): string {
        return this.title;
    }

    asquest(): string[] {
        const q: Array<string> = [];
        q.push('{');
        q.push(`    title: \`${this.title}\`,`);
        q.push(`    icon: \`${this.icon}\`,`);
        q.push(`    stype: ${this.stype},`);
        q.push(`    body: \`${this.body}\`,`);
        q.push('},');
        return q.reverse();
    }
}

export function create_quest(title: string, icon: string, type: string, body: string[], quest_list: Quest[]): void {
    // blizzard.j: REQ_DISCOVERED 0, REQ_UNDISCOVERED 1, OPT_DISCOVERED 2, OPT_UNDISCOVERED 3.
    // Undiscovered quests are hidden, so only the discovered types are used.
    const stype: number = type === "bj_QUESTTYPE_REQ_DISCOVERED" ? 0 : 2;
    while (body.length > 0 && body[body.length - 1].trim() === '') {
        body.pop();
    }
    // The game truncates quest text around 1000 characters, so a long entry becomes
    // "title - 1", "title - 2", ... split at its "Updates:" headings where possible.
    // Lines are joined with an escaped newline: the body lands inside a template literal in
    // the generated source, where \n becomes a real line break in the game.
    const parts: string[][] = split_to_fit(body);
    parts.forEach((part, index) => {
        const partTitle: string = parts.length > 1 ? `${title} - ${index + 1}` : title;
        quest_list.push(new Quest(partTitle, icon, stype, part.join('\\n')));
    });
}

function split_to_fit(body: string[]): string[][] {
    if (body.join('\\n').length < 1000) {
        return [body];
    }
    const [first, second] = split_quest(body);
    return [...split_to_fit(first), ...split_to_fit(second)];
}

export function split_quest(quest_body: string[]): [string[], string[]] {
    const indices: number[] = quest_body.map((x, i) => x.includes('Updates') ? i : -1).filter(i => i !== -1);

    if (indices.length >= 2) {
        const q_a = quest_body.slice(indices[0], indices[1]);
        const q_b = quest_body.slice(indices[1]);
        return [q_a, q_b];
    } else {
        const half = Math.floor(quest_body.length / 2);
        const q_a = quest_body.slice(0, half);
        const q_b = [q_a[0], ...quest_body.slice(half)];
        return [q_a, q_b];
    }
}

export function get_all_quests(): void {
    const quest_list: Quest[] = [];
    const files: string[] = fs.readdirSync('Quests').filter(file => file.includes('.md')).sort();
    for (const f of files) {
        const lines: string[] = fs.readFileSync(path.join('Quests', f), 'utf-8').split(/\r?\n/);
        const header: string[] = [];
        const body: string[] = [];
        let title: string = "";
        let icon: string = "ReplaceableTextures\\CommandButtons\\BTNAmbush.blp";
        let type: string = "bj_QUESTTYPE_REQ_DISCOVERED";
        let shouldread: boolean = false;
        let readbody: boolean = false;
        for (const line of lines) {
            if (line.includes('---')) {
                if (shouldread) {
                    readbody = true;
                }
                shouldread = true;
            } else if (shouldread) {
                if (readbody) {
                    if (body.length > 0 || line.length > 0) {
                        body.push(line);
                    }
                } else {
                    if (line.includes('title:')) {
                        title = line.match(/^.*'(.*)'.*$/)![1];
                    }
                    if (line.includes('icon:')) {
                        icon = line.match(/^.*'(.*)'.*$/)![1];
                    }
                    if (line.includes('type:')) {
                        const intype = line.match(/^.*'(.*)'.*$/)![1];
                        if (intype === 'required') {
                            type = "bj_QUESTTYPE_REQ_DISCOVERED";
                        }
                    }
                    header.push(line);
                }
            }
        }
        create_quest(title, icon, type, body, quest_list);
    }
    const template: string[] = fs.readFileSync(path.join('templates', 'questsGEN.ts.template'), 'utf-8').split(/\r?\n/);

    const stripped_list: string[] = template.map(line => line.trim());
    const pivot: number = stripped_list.indexOf("{{GENERATE}}");
    const spaces: number = template[pivot].length - "{{GENERATE}}".length;
    const spacer: string = ' '.repeat(spaces);

    const generated_quest_list: string[] = [];

    for (const quest of quest_list) {
        for (const line of quest.asquest()) {
            generated_quest_list.push(spacer + line);
        }
    }

    generated_quest_list.reverse();
    const generated_library: string[] = [...template.slice(0, pivot - 1), ...generated_quest_list, ...template.slice(pivot + 1)];

    fs.writeFileSync(path.join('src', 'Generated', 'questsGEN.ts'), generated_library.join('\n'));

    // ... code ...
}
get_all_quests();
