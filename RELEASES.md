## Version 5.1.2
Changed the visitor implementation to accept multiple parameters after the template parameter.

Moved the message evaluation and transition selection / execution to a visitor to free up core model classes.
* note that the intent is to remove much of the executable elements of the code from the core model claseses.

## Version 5.1.1
Created singletons for bootstrapping rather than static method in StateMachine and Bootstrap classes.

Inline invoke method and remove Dictionary interface.

Break up the source across mutliple files for managability using tsconfig.json to pull them back together into the same state.js output.

## Version 5.1.0
Fixes a bug that would cause completion transitions to fire for composite states that were not complete.

Changed the file management for releases: the latest version will always be lib/state.js, lib/state.min.js, and lib/state.d.ts; files with version numbers will also be available in lib/versions.

Renamed IContext to IActiveStateConfiguration, Context to StateMachineInstance.

Added an optional name parameter to the StateMachineInstance constructor and a toString method to return that name.

Cache the fully qualified element name during the bootstrap process (as its used in the StateMachineInstance class).

Simplify transition bootstrap logic by inlining bootstrapEnter.

Removed explicit var typing where implicit is sufficient.

Removed Behaviour type and just used Array of Action in place.

Remove Selector type and functions; replace with virtual methods on Vertex subtypes.

Implement a visitor pattern for state machine models.

Migtated transition bootstrap to a visitor.

Minor changes to StateMachine to enable it to be embedded within other state machines.

Remove evaluateCompletions method and just inline the code where used given its simplicity.

Remove assert function as it was used only once.

## Version 5.0.1
Fix bug relating to external transitions and orthogonal regions that could result in an invalid current active state.

Remove protected keywords due to a lack of tool support for it. 

## Version 5.0.0
Version 5 is a complete re-write from version 4.x.x:
- Much better performance by pre-computing all steps required during a state change. A clean/diry state is maintained  and re-computing possible if the machine strucutre changes.
- The API has changed to a fluent style enabling transitions to be defined in a more natural way.
- The code is authored in TypeScript; this hopefully will lead to better quality code. State machines using state.js can be authored in JavaScript of TypeScript.
