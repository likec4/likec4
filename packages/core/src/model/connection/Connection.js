import { isAncestor } from '../../utils';
export var Connection;
(function (Connection) {
    Connection.isInside = (fqn) => {
        return (connection) => isAncestor(fqn, connection.source.id) && isAncestor(fqn, connection.target.id);
    };
    Connection.isDirectedBetween = (source, target) => {
        return (connection) => (connection.source.id === source || isAncestor(source, connection.source.id))
            && (connection.target.id === target || isAncestor(target, connection.target.id));
    };
    Connection.isAnyBetween = (source, target) => {
        const forward = Connection.isDirectedBetween(source, target), backward = Connection.isDirectedBetween(target, source);
        return (connection) => forward(connection) || backward(connection);
    };
    Connection.isIncoming = (target) => {
        return (connection) => (connection.target.id === target || isAncestor(target, connection.target.id))
            && !isAncestor(target, connection.source.id);
    };
    Connection.isOutgoing = (source) => {
        return (connection) => (connection.source.id === source || isAncestor(source, connection.source.id))
            && !isAncestor(source, connection.target.id);
    };
    Connection.isAnyInOut = (source) => {
        const isIn = Connection.isIncoming(source), isOut = Connection.isOutgoing(source);
        return (connection) => isIn(connection) || isOut(connection);
    };
})(Connection || (Connection = {}));
