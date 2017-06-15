"use strict";
/**
 * @module tree
 *
 * A small library of tree algorithms.
 *
 * @copyright (c) 2017 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
exports.__esModule = true;
/**
 * Returns the ancestry of a node within a tree from the root as an array.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node The node to return the ancestry for.
 */
function ancestors(node) {
    var result = [];
    for (var i = node; i !== undefined; i = i.parent) {
        result.unshift(i);
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
    if (ancestry1 !== undefined && ancestry2 !== undefined) {
        var max = Math.min(ancestry1.length, ancestry2.length);
        while (result < max && ancestry1[result] === ancestry2[result]) {
            result++;
        }
    }
    return result - 1;
}
exports.lowestCommonAncestorIndex = lowestCommonAncestorIndex;
/**
 * Tests a node to see if it is in the ancestry of another node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
function isChild(child, parent) {
    for (var i = child; i !== undefined; i = i.parent) {
        if (i.parent === parent) {
            return true;
        }
    }
    return false;
}
exports.isChild = isChild;
/**
 * Returns the depth (number of edges from a node to the root) of a node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The node to get the depth of.
 * @returns The number of edges between the node an the root node. Returns -1 an undefined node is passed.
 */
function depth(node) {
    var result = -1;
    for (var i = node; i !== undefined; i = i.parent) {
        result++;
    }
    return result;
}
exports.depth = depth;
