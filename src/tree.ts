/** An abstract base class for tree [[Node]] instances. */
export interface INode {
	/** The parent node of this node. */
	parent: any;
}

/**
 * A [[Node]] within a tree.
 * @param TNode The type of the [[Node]]'s parent [[Node]].
 */
export interface Node<TNode extends INode> extends INode {
	/** The parent node of this node. */
	parent: TNode;
}

/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TNode The type of the [[Node]]'s parent [[Node]].
 * @param node The [[Node]] to return the ancestry for.
 */
export function Ancestors<TNode extends INode>(node: TNode): Array<TNode> {
	const result = node.parent ? Ancestors(node.parent) : new Array<TNode>();

	result.push(node);

	return result;
}

export function LCA<TNode extends INode>(ancestry1: Array<TNode>, ancestry2: Array<TNode>): number {
	let result = 0;

	while (ancestry1[result] === ancestry2[result]) {
		result++;
	}

	return result - 1;
}

