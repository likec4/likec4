import { allPass, anyPass, isNot, isNullish, isString } from 'remeda';
import { nonexhaustive } from '../utils/invariant';
export function isTagEqual(operator) {
    return 'tag' in operator;
}
export function isKindEqual(operator) {
    return 'kind' in operator;
}
export function isParticipantOperator(operator) {
    return 'participant' in operator;
}
export function isNotOperator(operator) {
    return 'not' in operator;
}
export function isAndOperator(operator) {
    return 'and' in operator;
}
export function isOrOperator(operator) {
    return 'or' in operator;
}
export function whereOperatorAsPredicate(operator) {
    switch (true) {
        case isParticipantOperator(operator): {
            const participant = operator.participant;
            const participantPredicate = whereOperatorAsPredicate(operator.operator);
            return participantIs(participant, participantPredicate);
        }
        case isTagEqual(operator): {
            if (isString(operator.tag) || 'eq' in operator.tag) {
                const tag = isString(operator.tag) ? operator.tag : operator.tag.eq;
                return (value) => {
                    return Array.isArray(value.tags) && value.tags.includes(tag);
                };
            }
            const tag = operator.tag.neq;
            return (value) => {
                return !Array.isArray(value.tags) || !value.tags.includes(tag);
            };
        }
        case isKindEqual(operator): {
            if (isString(operator.kind) || 'eq' in operator.kind) {
                const kind = isString(operator.kind) ? operator.kind : operator.kind.eq;
                return (value) => {
                    return value.kind === kind;
                };
            }
            const kind = operator.kind.neq;
            return (value) => {
                return isNullish(value.kind) || value.kind !== kind;
            };
        }
        case isNotOperator(operator): {
            const predicate = whereOperatorAsPredicate(operator.not);
            return isNot(predicate);
        }
        case isAndOperator(operator): {
            const predicates = operator.and.map(whereOperatorAsPredicate);
            return allPass(predicates);
        }
        case isOrOperator(operator): {
            const predicates = operator.or.map(whereOperatorAsPredicate);
            return anyPass(predicates);
        }
        default:
            nonexhaustive(operator);
    }
}
function participantIs(participant, predicate) {
    return (value) => {
        if (!value.source || !value.target) {
            return false;
        }
        switch (participant) {
            case 'source': {
                return predicate(value.source);
            }
            case 'target': {
                return predicate(value.target);
            }
        }
    };
}
