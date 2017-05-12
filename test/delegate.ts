import { create as delegate } from "../lib/node/delegate";

function world(s: string) {
	console.log(s + " world");
}

const one = delegate((s: string) => console.log(s + " Hello world"));
const two = delegate((s: string) => console.log(s + " Hello"), world);

one("A");
two("B");

delegate(one, two)("C");