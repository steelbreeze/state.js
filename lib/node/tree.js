/**
 * state: a finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */
"use strict";
exports.__esModule = true;
/**
 * Returns the ancestry of a node within a tree from the root as an array.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node The node to return the ancestry for.
 */
function ancestors(node) {
    var result = node && node.parent ? ancestors(node.parent) : [];
    if (node) {
        result.push(node);
    }
    return result;
}
exports.ancestors = ancestors;
/**
 * Returns the index of the lowest/least common ancestor given a pair of ancestrys.
 * @param TNode A common type shared by all node instances within the tree.
 * @param ancestry1 The ancestry of a node within the tree.
 * @param ancestry2 The ancestry of a node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function lowestCommonAncestorIndex(ancestry1, ancestry2) {
    var result = 0;
    if (ancestry1 && ancestry2) {
        while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
            result++;
        }
    }
    return result - 1;
}
exports.lowestCommonAncestorIndex = lowestCommonAncestorIndex;
/**
 * Returns the lowest/least common ancestor given a pair of nodes.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node1 A node within the tree.
 * @param node2 A node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function lowestCommonAncestor(node1, node2) {
    var ancestry1 = ancestors(node1);
    var ancestry2 = ancestors(node2);
    var index = lowestCommonAncestorIndex(ancestry1, ancestry2);
    return index === -1 ? undefined : ancestry1[index];
}
exports.lowestCommonAncestor = lowestCommonAncestor;
/**
 * Tests a node to see if it is in the ancestry of another node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
function isChild(child, parent) {
    return child && child.parent ? child.parent === parent || isChild(child.parent, parent) : false;
}
exports.isChild = isChild;
/**
 * Returns the level of the .
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
function depth(node) {
    return node ? node.parent ? depth(node.parent) + 1 : 0 : -1;
}
exports.depth = depth;
