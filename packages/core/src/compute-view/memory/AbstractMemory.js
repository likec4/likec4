export class AbstractMemory {
    state;
    /**
     * Provides access to context types
     * !IMPORTANT: Should not be called in runtime
     *
     * @example
     * ```ts
     *   type State = SomeMemory['Ctx']['MutableState']
     * ```
     */
    get Ctx() {
        throw new Error('Should not be called in runtime');
    }
    constructor(state) {
        this.state = state;
    }
    get elements() {
        return this.state.elements;
    }
    get explicits() {
        return this.state.explicits;
    }
    get final() {
        return this.state.final;
    }
    get connections() {
        return this.state.connections;
    }
    isEmpty() {
        return this.elements.size === 0 && this.connections.length === 0
            && this.explicits.size === 0 && this.final.size === 0;
    }
}
