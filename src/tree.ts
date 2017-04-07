/**
 * state: a finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */

/**
 * Returns the ancestry of a node within a tree from the root as an array.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node The node to return the ancestry for.
 */
export function ancestors<TNode extends { parent: any }>(node: TNode): Array<TNode> {
	const result = node && node.parent ? ancestors(node.parent) : new Array<TNode>();

	if (node) {
		result.push(node);
	}

	return result;
}

/**
 * Returns the index of the lowest/least common ancestor given a pair of ancestrys.
 * @param ancestry1 The ancestry of a node within the tree.
 * @param ancestry2 The ancestry of a node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
export function lowestCommonAncestorIndex(ancestry1: Array<any>, ancestry2: Array<any>): number {
	let result = 0;

	if (ancestry1 && ancestry2) {
		while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
			result++;
		}
	}

	return result - 1;
}

/**
 * Tests a node to see if it is in the ancestry of another node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
export function isChild<TNode extends { parent: any }>(child: TNode, parent: TNode): boolean {
	while (child) {
		if (child.parent === parent) {
			return true;
		}

		child = child.parent;
	}

	return false;
}