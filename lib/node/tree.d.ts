/** An abstract base class for tree [[Node]] instances. */
export interface INode {
    /** The parent node of this node. */
    parent: any;
    children: Array<any>;
}
/**
 * A [[Node]] within a tree.
 * @param TNode The type of the [[Node]]'s parent [[Node]].
 */
export interface Node<TParent extends INode, TChild extends INode> extends INode {
    /** The parent node of this node. */
    parent: TParent;
    children: Array<TChild>;
}
/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TNode The type of the [[Node]]'s parent [[Node]].
 * @param node The [[Node]] to return the ancestry for.
 */
export declare function Ancestors<TNode extends INode>(node: TNode): Array<TNode>;
export declare function LCA<TNode extends INode>(ancestry1: Array<TNode>, ancestry2: Array<TNode>): number;
