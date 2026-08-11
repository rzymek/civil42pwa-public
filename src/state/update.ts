update.onUpdate = [] as (() => void)[];

export function update<T, A extends unknown[]>(fn: (...args: A) => T): (...args: A) => T {
    return (...args: A) => {
        try {
            return fn(...args)
        } finally {
            update.onUpdate.forEach(it => it());
        }
    }
}