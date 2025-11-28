# Multi-Relation Extend Example

This example demonstrates the `extend relation` feature in LikeC4, which allows you to add metadata, tags, and links to existing relations from separate files.

## Files

- **`base.c4`**: Defines the base model with elements and relations
- **`extend-1.c4`**: Operations team adds monitoring/performance metadata
- **`extend-2.c4`**: Security team adds security metadata

## What This Example Tests

### Test 1: Untyped Relation with Title

**Base**: `frontend -> api "Makes requests"`

- No relationship kind specified
- Extended by both operations and security teams
- Should receive metadata from both extend-1.c4 and extend-2.c4

### Test 2: Typed Relation with Same Title

**Base**: `frontend -[sync]-> api "Makes requests"`

- Uses `sync` relationship kind
- Has the SAME title as Test 1 but different kind
- Should be treated as a DIFFERENT relation from Test 1
- Only receives extends that explicitly match `[sync]` kind

### Test 3: Typed Relation with Different Title

**Base**: `frontend -[async]-> api "Sends analytics data"`

- Uses `async` relationship kind with unique title
- Should only receive extends that match both kind and title

### Test 4: Empty Title Normalization

**Base**:

- `userDB -> authService` (no title)
- `userDB -> authService ""` (empty string title)

Both are normalized to empty string internally, so:

- `extend userDB -> authService` matches BOTH base relations
- `extend userDB -> authService ""` also matches BOTH base relations

## Key Concepts Demonstrated

1. **Relation Identity**: Relations are uniquely identified by:
   - Source element
   - Target element
   - Relationship kind (or lack thereof)
   - Title (or empty string)

2. **Metadata Merging**:
   - New keys are added
   - Duplicate keys with different values become arrays
   - Duplicate keys with same values are de-duplicated

3. **Multi-Team Collaboration**: Different teams can extend the same relations with their specific metadata without modifying the base model.

4. **Title Normalization**: Relations without a title and relations with an empty string title are treated identically.
