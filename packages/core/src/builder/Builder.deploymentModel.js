export function deployment(...ops) {
    return (input) => {
        let builder = input;
        for (const op of ops) {
            builder = op(builder);
        }
        return builder;
    };
}
