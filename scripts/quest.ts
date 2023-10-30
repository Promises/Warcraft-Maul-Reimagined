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

export function create_quest(title: string, icon: string, type: string, body: string[], number: number[], quest_list: Quest[]): void {
    const s: string = '\\n';

    let stype: number;
    switch (type) {
        case "bj_QUESTTYPE_REQ_DISCOVERED":
            stype = 1;
            break;
        // ... Add other cases as needed
        default: // "bj_QUESTTYPE_OPT_DISCOVERED" and any other unhandled types will default here
            stype = 2;
            break;
    }

    if (s.concat(...body).length >= 1000) {
        const [q_a, q_b] = split_quest(body);
        number[0]++;
        create_quest(title, icon, type, q_a, number, quest_list);
        number[0]++;
        create_quest(title, icon, type, q_b, number, quest_list);
    } else {
        if (number[0] !== 0) {
            title = `${title} - ${number[0]}`;
        }
        quest_list.push(new Quest(title, icon, stype, s.concat(...body)));
    }
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
        const lines: string[] = fs.readFileSync(path.join('Quests', f), 'utf-8').split('\n');
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
        create_quest(title, icon, type, body, [0], quest_list);
    }
    const template: string[] = fs.readFileSync(path.join('templates', 'questsGEN.ts.template'), 'utf-8').split('\n');

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
