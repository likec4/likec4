# Dynamic Sequence Showcase

This example demonstrates all LikeC4 dynamic view sequence-diagram constructs in a single coherent use case: a multi-step payment and fulfillment flow with error handling, retries, conditional logic, and parallel operations.

The view exercises:
- Conditional branching (`if/else`)
- Optional blocks (`optional`)
- Loops with retry logic (`repeat`)
- Parallel branches with labels (`parallel { branch … }`)
- Grouping (`group`)
- Critical path with fallbacks (`critical { … } on { … }`)
- Break on error (`break`)
- Notes (over actors, left-of, right-of)
- Activation tracking (`activate`/`deactivate`)
- Participant lifecycle (`create`/`destroy`)
- Automatic step numbering (`autonumber`)

View `model.c4` for the model and `views.c4` for the sequence diagram.
