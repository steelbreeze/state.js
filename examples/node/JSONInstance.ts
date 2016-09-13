import * as state from "../../lib/state.com";

interface IStateNode {
    name: string;
    regions: IRegionNode[];
}

interface IRegionNode {
    name: string;
    states: IStateNode[];
    lastKnownState?: string;
}

export class JSONInstance implements state.IInstance {
    private data: IStateNode;
    public isTerminated: boolean = false;

    constructor(private name: string) { }

    public setCurrent(region: state.Region, state: state.State): void {
        this.findRegionNode(region).lastKnownState = state.name;
    }

    public getCurrent(region: state.Region): state.State {
        let lastKnownState = this.findRegionNode(region).lastKnownState;

        return region.vertices.reduce<state.State>((result, item) => item instanceof state.State && item.name === lastKnownState ? item : result, undefined);
    }

    private findRegionNode(region: state.Region): IRegionNode {
        let stateNode = this.findStateNode(region.parent);
        var regionNode = stateNode.regions.reduce((result, item) => item.name === region.name ? item : result, undefined);

        if (!regionNode) {
            stateNode.regions.push(regionNode = { "name": region.name, "states": [] });
        }

        return regionNode;
    }

    private findStateNode(state: state.State): IStateNode {
        if (state.parent) {
            let regionNode = this.findRegionNode(state.parent);
            let stateNode = regionNode.states.reduce((result, item) => item.name === state.name ? item : result, undefined);

            if (!stateNode) {
                regionNode.states.push(stateNode = { "name": state.name, "regions": [] });
            }

            return stateNode;
        } else {
            if (!this.data) {
                this.data = { "name": state.name, "regions": [] };
            }

            return this.data;
        }
    }

    public toJSON(): string {
        return JSON.stringify(this.data);
    }

    public fromJSON(json: string) {
        return this.data = JSON.parse(json);
    }

    public toString(): string {
        return this.name;
    }
}