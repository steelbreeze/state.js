import * as state from "../../lib/state.com";

interface IJSONNode {
    name: string;
    children: IJSONNode[];
    lastKnown?: string;
}

export class JSONInstance implements state.IInstance {
    private activeStateConfiguration: IJSONNode;
    public isTerminated: boolean = false;

    constructor(private name: string) { }

    public setCurrent(region: state.Region, state: state.State): void {
        this.getNode(region).lastKnown = state.name;
    }

    public getCurrent(region: state.Region): state.State {
        let lastKnown = this.getNode(region).lastKnown;

        return region.vertices.reduce<state.State>((result, item) => item instanceof state.State && item.name === lastKnown ? item : result, undefined);
    }

    private getNode(state: state.State | state.Region): IJSONNode {
        if (state.parent) {
            let parentNode = this.getNode(state.parent);
            let node = parentNode.children.reduce((result, item) => item.name === state.name ? item : result, undefined);

            if (!node) {
                node = { "name": state.name, "children": [] };

                parentNode.children.push(node);
            }

            return node;
        } else {
            if (!this.activeStateConfiguration) {
                this.activeStateConfiguration = { "name": state.name, "children": [] };
            }

            return this.activeStateConfiguration;
        }
    }

    public toJSON(): string {
        return JSON.stringify(this.activeStateConfiguration);
    }

    public fromJSON(json: string) {
        return this.activeStateConfiguration = JSON.parse(json);
    }

    public toString(): string {
        return this.name;
    }
}