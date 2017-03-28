/** An abstract base class for tree [[Node]] instances. */
export interface INode {
    /** The parent node of this node. */
    parent: any;
    /** The child nodes of this node. */
    children: Array<any>;
}
/**
 * A [[Node]] within a tree.
 * @param TParent The type of the [[Node]]'s parent [[Node]].
 * @param TChildren A common type shared by all the [[Node]]'s children.
 */
export interface Node<TParent extends INode, TChildren extends INode> extends INode {
    /** The parent node of this node. */
    parent: TParent;
    /** The child nodes of this node. */
    children: Array<TChildren>;
}
/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param node The [[Node]] to return the ancestry for.
 */
export declare function Ancestors<TNode extends INode>(node: TNode): Array<TNode>;
/**
 * Returns the index of the lowest/least common ancestor of a pair of nodes within a Tree.
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param ancestry1 A [[Node]] within the tree.
 * @param ancestry2 A [[Node]] within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
export declare function LowestCommonAncestorIndex<TNode extends INode>(ancestry1: Array<TNode>, ancestry2: Array<TNode>): number;
