export interface FbUser {
    uid: string;
    email: string;
    token: string;
}

export interface AuthContextValues {
    user: FbUser;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginAndRedirect: (email: string, password: string, redirectTo: string) => Promise<void>;
    logout: () => Promise<void>;
    logoutAndRedirect: (redirectTo: string) => Promise<void>;
}
