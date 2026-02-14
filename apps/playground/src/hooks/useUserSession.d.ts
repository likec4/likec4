export type UserSession = {
    login: string;
    userId: number;
    name: string;
    avatarUrl: string | null;
};
export declare function useUserSession(): UserSession | null;
