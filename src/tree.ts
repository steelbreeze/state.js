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
 * @param TChildren The type of the [[Node]]'s children [[Node]]s.
 */
export interface Node<TParent extends INode, TChildren extends INode> extends INode {
	/** The parent node of this node. */
	parent: TParent;

	/** The child nodes of this node. */
	children: Array<TChildren>;
}

/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TParent The type of the [[Node]]'s parent [[Node]].
 * @param node The [[Node]] to return the ancestry for.
 */
export function Ancestors<TParent extends INode>(node: TParent): Array<TParent> {
	const result = node.parent ? Ancestors(node.parent) : new Array<TParent>();

	result.push(node);

	return result;
}

export function LowestCommonAncestorIndex<TParent extends INode>(ancestry1: Array<TParent>, ancestry2: Array<TParent>): number {
	let result = 0;

	while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
		result++;
	}

	return result - 1;
}

