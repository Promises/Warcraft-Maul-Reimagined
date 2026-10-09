/**
 * Unit tests of the map's pure Lua code, run by a plain Lua outside the game (npm run test:lua).
 * Each file registers its checks with `check`; a failure exits with status 1.
 */
import {saveTests} from './save.test';
import {recipeTests} from './recipe.test';

let failures = 0;
let passed = 0;

export function check(this: void, what: string, ok: boolean, detail: string = ''): void {
    if (ok) {
        passed++;
    } else {
        failures++;
        print(`FAIL ${what}${detail === '' ? '' : ': ' + detail}`);
    }
}

saveTests(check);
recipeTests(check);
print(`${passed} passed, ${failures} failed`);
if (failures > 0) {
    os.exit(1);
}
