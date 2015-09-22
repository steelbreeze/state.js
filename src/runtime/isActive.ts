/*
 * Finite state machine library
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 * http://www.steelbreeze.net/state.cs
 */
module StateJS {
	/**
	 * Determines if a vertex is currently active; that it has been entered but not yet exited.
	 * @function isActive
	 * @param {Vertex} vertex The vertex to test.
	 * @param {IInstance} instance The instance of the state machine model.
	 * @returns {boolean} True if the vertex is active.
	 */
	export function isActive(vertex: Vertex, instance: IInstance): boolean {
		return vertex.region ? (isActive(vertex.region.state, instance) && (instance.getCurrent(vertex.region) === vertex)) : true;
	}
}