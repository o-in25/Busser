export type Result<T> = {
    data?: T,
    error?: {
        type?: number | string,
        message?: string
    }
}