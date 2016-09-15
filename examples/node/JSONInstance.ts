import * as state from "../../lib/state.com";

/** Definition of a node within a JSON representation of the active state configuration of a state machine model. */
interface IJSONNode {
    /** The name of the named element. */
    name: string;

    /** Child nodes. */
    children: IJSONNode[];

    /** The last known state for nodes representing regions. */
    lastKnown?: string;
}

/** Manages the active state configuration of a state machine instance using a serializable JSON structure. */
export class JSONInstance implements state.IInstance {
    /** The active state configuration represented as a JSON object */
    private activeStateConfiguration: IJSONNode;

    /** Indicates that the state machine instance has reached a [[PseudoStateKind.Terminate]] [[PseudoState]] and therfore will no longer respond to messages. */
    public isTerminated: boolean = false;

    /** Creates a new instance of the JSONInstance class. */
    constructor(private name: string) { }

    /** Sets the current State for a given Region. */
    public setCurrent(region: state.Region, state: state.State): void {
        this.getNode(region).lastKnown = state.name;
    }

    /** Returns the current State for a given Region. */
    public getCurrent(region: state.Region): state.State {
        let lastKnown = this.getNode(region).lastKnown;

        return region.vertices.reduce<state.State>((result, item) => item instanceof state.State && item.name === lastKnown ? item : result, undefined);
    }

    /** Finds a node within the active state configuration for a given Region. */
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

    /** Returns the Ac */
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