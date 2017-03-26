/** Namespace for tree data structures and associated algorithms. */
export interface INode {
    parent: any;
}
export interface Node<TNode extends INode> extends INode {
    parent: TNode;
}
export declare function Ancestors<TNode extends INode>(node: TNode): Array<TNode>;
export declare function LCA<TNode extends INode>(ancestry1: Array<TNode>, ancestry2: Array<TNode>): number;
