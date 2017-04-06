/**
 * state: a finite state machine library
 * Copyright (c) 2014-6 David Mesquita-Morris
 * Licensed under the MIT and GPL v3 licences
 * http://state.software
 */
"use strict";
exports.__esModule = true;
/**
 * Returns the ancestry of the [[Node]] from the root [[Node]] to the [[Node]] provided.
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param node The [[Node]] to return the ancestry for.
 */
function Ancestors(node) {
    var result = node.parent ? Ancestors(node.parent) : new Array();
    result.push(node);
    return result;
}
exports.Ancestors = Ancestors;
/**
 * Returns the index of the lowest/least common ancestor of a pair of nodes within a Tree.
 * @param TNode A common type shared by all [[Node]] instances within the tree.
 * @param ancestry1 A [[Node]] within the tree.
 * @param ancestry2 A [[Node]] within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
function LowestCommonAncestorIndex(ancestry1, ancestry2) {
    var result = 0;
    while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
        result++;
    }
    return result - 1;
}
exports.LowestCommonAncestorIndex = LowestCommonAncestorIndex;
