/**
 * Returns summary if it is not null, otherwise returns description
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferSummary(a) {
    return a.summary ?? a.description;
}
/**
 * Returns description if it is not null, otherwise returns summary
 */
/* @__NO_SIDE_EFFECTS__ */
export function preferDescription(a) {
    return a.description ?? a.summary;
}
