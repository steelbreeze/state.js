/* global describe, it */
var assert = require("assert"),
	tree = require("../lib/node/tree");

var root = { name: "root" };
var left = { name: "left", parent: root };
var right = { name: "right", parent: root };
var rightLeft = { name: "rightLeft", parent: right };
var rightRight = { name: "rightRight", parent: right };
var other = { name: "other" };

describe("test/tree.js", function () {
	it("Ancestors count", function () {
		assert.equal(1, tree.Ancestors(root).length);
		assert.equal(2, tree.Ancestors(left).length);
		assert.equal(2, tree.Ancestors(right).length);
		assert.equal(3, tree.Ancestors(rightLeft).length);
		assert.equal(3, tree.Ancestors(rightRight).length);
		assert.equal(1, tree.Ancestors(other).length);
	});

	it("Common ancestor", function () {
		assert.equal(0, tree.LCA(tree.Ancestors(root), tree.Ancestors(root)));
		assert.equal(0, tree.LCA(tree.Ancestors(root), tree.Ancestors(left)));
		assert.equal(0, tree.LCA(tree.Ancestors(root), tree.Ancestors(right)));
		assert.equal(0, tree.LCA(tree.Ancestors(root), tree.Ancestors(rightLeft)));
		assert.equal(0, tree.LCA(tree.Ancestors(root), tree.Ancestors(rightRight)));
		assert.equal(-1, tree.LCA(tree.Ancestors(root), tree.Ancestors(other)));

		assert.equal(0, tree.LCA(tree.Ancestors(left), tree.Ancestors(root)));
		assert.equal(1, tree.LCA(tree.Ancestors(left), tree.Ancestors(left)));
		assert.equal(0, tree.LCA(tree.Ancestors(left), tree.Ancestors(right)));
		assert.equal(0, tree.LCA(tree.Ancestors(left), tree.Ancestors(rightLeft)));
		assert.equal(0, tree.LCA(tree.Ancestors(left), tree.Ancestors(rightRight)));
		assert.equal(-1, tree.LCA(tree.Ancestors(left), tree.Ancestors(other)));

		assert.equal(0, tree.LCA(tree.Ancestors(right), tree.Ancestors(root)));
		assert.equal(0, tree.LCA(tree.Ancestors(right), tree.Ancestors(left)));
		assert.equal(1, tree.LCA(tree.Ancestors(right), tree.Ancestors(right)));
		assert.equal(1, tree.LCA(tree.Ancestors(right), tree.Ancestors(rightLeft)));
		assert.equal(1, tree.LCA(tree.Ancestors(right), tree.Ancestors(rightRight)));
		assert.equal(-1, tree.LCA(tree.Ancestors(right), tree.Ancestors(other)));

		assert.equal(0, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(root)));
		assert.equal(0, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(left)));
		assert.equal(1, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(right)));
		assert.equal(2, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(rightLeft)));
		assert.equal(1, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(rightRight)));
		assert.equal(-1, tree.LCA(tree.Ancestors(rightLeft), tree.Ancestors(other)));

		assert.equal(0, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(root)));
		assert.equal(0, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(left)));
		assert.equal(1, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(right)));
		assert.equal(1, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(rightLeft)));
		assert.equal(2, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(rightRight)));
		assert.equal(-1, tree.LCA(tree.Ancestors(rightRight), tree.Ancestors(other)));

		assert.equal(-1, tree.LCA(tree.Ancestors(other), tree.Ancestors(root)));
		assert.equal(-1, tree.LCA(tree.Ancestors(other), tree.Ancestors(left)));
		assert.equal(-1, tree.LCA(tree.Ancestors(other), tree.Ancestors(right)));
		assert.equal(-1, tree.LCA(tree.Ancestors(other), tree.Ancestors(rightLeft)));
		assert.equal(-1, tree.LCA(tree.Ancestors(other), tree.Ancestors(rightRight)));
		assert.equal(0, tree.LCA(tree.Ancestors(other), tree.Ancestors(other)));
	});
});

