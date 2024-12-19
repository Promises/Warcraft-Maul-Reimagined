import {Node} from './Node';
import {NodeQueue} from './NodeQueue';
import {Log} from '../../lib/Serilog/Serilog';
import {AntiJuggleTower} from '../Entity/AntiJuggle/AntiJuggleTower';
import {Image} from "../../JassOverrides/Image";
import {Defender} from "../Entity/Players/Defender";

export enum Walkable {
    Walkable,
    Blocked,
    Protected,
}

export class Maze {


    public static readonly ROW_NUM: number[] = [-1, 0, 0, 1];
    public static readonly COL_NUM: number[] = [0, -1, 1, 0];
    public readonly minX: number;
    public readonly minY: number;
    public readonly maxX: number;
    public readonly maxY: number;
    public readonly width: number;
    public readonly height: number;
    public readonly maze: Walkable[][];
    private antiJugglers: AntiJuggleTower[] = [];
    public gridPoints: Image[][] = [];

    constructor(minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, maze: Walkable[][]) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this.width = width;
        this.height = height;
        this.maze = maze;
        this.initializeGridPoints();

    }


    private initializeGridPoints(): void {
        const imagePath: string = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';

        // Initialize the 2D array
        // this.gridPoints = Array(this.width);
        // for (let x = 0; x < this.width; x++) {
        //     this.gridPoints[x] = Array(this.height);
        // }

        // Create grid points at cell centers with matching maze structure
        for (let x: number = 0; x < this.width; x++) {
            this.gridPoints[x] = [];
            for (let y: number = 0; y < this.height; y++) {
                const xPos = this.minX + (x * 64) + 32; // Add 32 to center in cell
                const yPos = this.minY + (y * 64) + 32; // Add 32 to center in cell
                const img: Image = new Image(imagePath, 64, xPos, yPos, 0.00);

                // SetImageColor(img.img, 0, 0, 255, 153); // Blue with ~60% opacity
                if (this.maze[x][y] === Walkable.Walkable) {
                    img.colour = {red: 0, green: 0, blue: 255, alpha: 153}; // Blue
                } else {
                    img.colour = {red: 255, green: 0, blue: 0, alpha: 153}; // Red
                }

                img.SetImageRenderAlways(true);
                img.visible = false; // Initially hidden
                this.gridPoints[x][y] = img;
            }
        }
    }

    public showGridPoints(): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.gridPoints[x][y].visible = true;
            }
        }
    }

    public hideGridPoints(): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.gridPoints[x][y].visible = false;
            }
        }
    }


    public setWalkable(x: number, y: number, isWalkable: Walkable): void {
        this.maze[x][y] = isWalkable;
        const point = this.gridPoints[x][y];
        if (isWalkable === Walkable.Walkable) {
            point.colour = {red: 0, green: 0, blue: 255, alpha: 153}; // Blue
        } else {
            point.colour = {red: 255, green: 0, blue: 0, alpha: 153}; // Red
        }
    }

    public getWalkable(x: number, y: number): Walkable {
        return this.maze[x][y];
    }

    public breathFirstSearch(sourceX: number, sourceY: number, destinationX: number, destinationY: number): number {
        if (this.maze[sourceX][sourceY] !== Walkable.Walkable || this.maze[destinationX][destinationY] !== Walkable.Walkable) {
            return -1;
        }

        const visited: boolean[] = [];
        for (let i: number = 0; i < this.width; i++) {
            for (let j: number = 0; j < this.height; j++) {
                visited[i + j * this.width] = false;
            }
        }

        visited[sourceX + sourceY * this.width] = true;

        const q: NodeQueue = new NodeQueue();
        const s: Node = new Node(sourceX, sourceY, 0);
        q.push(s);

        while (!q.empty()) {
            const curr: Node = q.front();

            if (curr.x === destinationX && curr.y === destinationY) {
                return curr.distance;
            }

            q.pop();

            for (let i: number = 0; i < 4; i++) {
                const row: number = curr.x + Maze.ROW_NUM[i];
                const col: number = curr.y + Maze.COL_NUM[i];

                if (this.isValid(row, col) && this.maze[row][col] === Walkable.Walkable && visited[row + col * this.width] === false) {
                    visited[row + col * this.width] = true;
                    q.push(new Node(row, col, curr.distance + 1));
                }
            }
        }

        return -1;
    }

    private isValid(row: number, col: number): boolean {
        return (row >= 0 && row < this.width && col >= 0 && col < this.height);
    }

    public Cleanup(x: number, y: number): void {

        if (this.maze[x][y] === Walkable.Protected) {
            this.setWalkable(x, y, Walkable.Walkable);
        }
    }

    public CleanAll(): void {
        for (const antijuggle of this.antiJugglers) {
            antijuggle.EndOfRoundAction();
        }
        this.antiJugglers = [];
        for (let x: number = 0; x < this.width; x++) {
            for (let y: number = 0; y < this.height; y++) {
                this.Cleanup(x, y);
            }
        }
    }

    public SanityCheck(): void {
        for (let x: number = 0; x < this.width; x++) {
            for (let y: number = 0; y < this.height; y++) {
                const cornerX: number = (x * 64) + this.minX;
                const cornerY: number = y * 64 + this.minY;
                if (IsTerrainPathable(cornerX, cornerY, PATHING_TYPE_WALKABILITY) === (this.maze[x][y] === Walkable.Walkable) ||
                    IsTerrainPathable(cornerX, cornerY + 32, PATHING_TYPE_WALKABILITY) === (this.maze[x][y] === Walkable.Walkable) ||
                    IsTerrainPathable(cornerX + 32, cornerY, PATHING_TYPE_WALKABILITY) === (this.maze[x][y] === Walkable.Walkable) ||
                    IsTerrainPathable(cornerX + 32, cornerY + 32, PATHING_TYPE_WALKABILITY) === (this.maze[x][y] === Walkable.Walkable)) {
                    Log.Error(`${x}, ${y} is a missmatch, ${Walkable[this.maze[x][y]]}`);
                }
            }
        }
    }

    public CheckAll(): void {

        for (let x: number = 0; x < this.width; x++) {
            for (let y: number = 0; y < this.height; y++) {
                const cornerX: number = (x * 64) + this.minX;
                const cornerY: number = y * 64 + this.minY;
                if (IsTerrainPathable(cornerX, cornerY, PATHING_TYPE_WALKABILITY) ||
                    IsTerrainPathable(cornerX, cornerY + 32, PATHING_TYPE_WALKABILITY) ||
                    IsTerrainPathable(cornerX + 32, cornerY, PATHING_TYPE_WALKABILITY) ||
                    IsTerrainPathable(cornerX + 32, cornerY + 32, PATHING_TYPE_WALKABILITY)) {
                    Log.Debug(`${x}, ${y} is a unwalkable`);
                }
            }
        }
    }

    public AddAntiJuggler(antijuggle: AntiJuggleTower): void {
        this.antiJugglers.push(antijuggle);
    }

    public GetAntiJugglers(): AntiJuggleTower[] {
        return this.antiJugglers;
    }

    public getHighlightedPointsCenter(points: { x: number, y: number }[]): { x: number, y: number } | undefined {
        if (points.length === 0) {
            return undefined;
        }

        // Find min and max coordinates
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));

        // Calculate center in grid coordinates
        const centerGridX = minX + (maxX - minX) / 2;
        const centerGridY = minY + (maxY - minY) / 2;

        // Convert to world coordinates
        return {
            x: this.minX + (centerGridX * 64) + 32,  // Add 32 to get center of cell
            y: this.minY + (centerGridY * 64) + 32
        };
    }

    public highlightGridPoints(mouseX: number, mouseY: number, defender: Defender): void {
        // Convert mouse coordinates to maze coordinates
        const relativeX = mouseX - this.minX;
        const relativeY = mouseY - this.minY;

        // Find the grid cell (offsetting to make mouse position top-left instead of bottom-left)
        const cellX = Math.floor(relativeX / 64);
        const cellY = Math.floor(relativeY / 64) - 1;  // Subtract 1 to shift up one cell

        // Reset previously highlighted points to their original colors
        for (const point of defender.highlightedPoints) {
            let col = this.gridPoints[point.x][point.y].colour;
            if (defender.isLocal()) {
                if (this.maze[point.x][point.y] === Walkable.Walkable) {
                    col = {red: 0, green: 0, blue: 255, alpha: 153}; // Blue
                } else {
                    col = {red: 255, green: 0, blue: 0, alpha: 153}; // Red
                }
            }
            this.gridPoints[point.x][point.y].colour = col
        }

        // Calculate new points to highlight
        const newPoints = [
            {x: cellX, y: cellY},       // Top left
            {x: cellX + 1, y: cellY},   // Top right
            {x: cellX, y: cellY + 1},   // Bottom left
            {x: cellX + 1, y: cellY + 1}  // Bottom right
        ].filter(point =>
            point.x >= 0 && point.x < this.width &&
            point.y >= 0 && point.y < this.height
        );

        // Highlight new points
        for (const point of newPoints) {
            let col = this.gridPoints[point.x][point.y].colour;
            if (defender.isLocal() && this.maze[point.x][point.y] === Walkable.Walkable) {
                col = {red: 0, green: 255, blue: 0, alpha: 153}; // green
            }
            this.gridPoints[point.x][point.y].colour = col;
        }

        // Update defender's highlighted points
        defender.highlightedPoints = newPoints;
        defender.updateBuildEffect()
    }

    public isPointInMaze(x: number, y: number): boolean {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }

    setBuildmode(player: Defender, buildMode: boolean) {

        for (let x: number = 0; x < this.width; x++) {
            for (let y: number = 0; y < this.height; y++) {
                let showImg = this.gridPoints[x][y].visible;
                if (player.isLocal()) {
                    showImg = buildMode;
                }
                this.gridPoints[x][y].visible = showImg;
            }
        }
    }
}
