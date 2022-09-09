import React, { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { useRouter } from "next/router";

import { FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import { AuthContextValues, FbUser } from "./authTypes";
import { mapUserData } from "./mapUserData";

const authContext = createContext<AuthContextValues>({
    loading: false,
    user: null,
});

const useProvideAuth = ({ firebaseApp }: { firebaseApp: FirebaseApp }) => {
    const [user, setUser] = useState<FbUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    //Promise-style login method
    const login = async (email: string, password: string) => {
        return new Promise<FbUser>((resolve, reject) => {
            try {
                console.log("Trying to login with email", email);
                signInWithEmailAndPassword(getAuth(firebaseApp), email, password);
            } catch (error) {
                reject(error);
            }
        });
    };

    //Logs user in, then automatically redirects to the chosen page
    const loginAndRedirect = async (email: string, password: string, redirectTo: string) => {
        try {
            await login(email, password);
            router.push(redirectTo);
        } catch (error) {
            console.error("Failed to login", error);
        }
    };

    //Promise-style logout method
    const logout = async () => {
        return new Promise<void>((resolve, reject) => {
            try {
                signOut(getAuth(firebaseApp)).then(resolve);
            } catch (error) {
                reject(error);
            }
        });
    };

    //Logs user out, then automatically redirects to the chosen page
    const logoutAndRedirect = async (redirectTo: string) => {
        console.log("Logging out");
        signOut(getAuth(firebaseApp))
            .then(() => {
                // Sign-out successful.
                console.log("Logout success, redirecting to ", redirectTo);
                if (redirectTo) router.push(redirectTo);
            })
            .catch(e => {
                console.error("Logout failed", e);
            });
    };
    // Firebase updates the id token every hour, this
    // makes sure the react state and the cookie are
    // both kept up to date
    useEffect(() => {
        console.log("Adding listener");
        const cancelAuthListener = onAuthStateChanged(getAuth(firebaseApp), async user => {
            if (user) {
                console.log("ID token received for user ", user.email);
                const userData = await mapUserData(user);
                setUser(userData);
                setLoading(false);
            } else {
                console.log("ID token unset - removing cookie and user");
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            cancelAuthListener();
        };
    }, []);

    return {
        user,
        loading,
        login,
        loginAndRedirect,
        logout,
        logoutAndRedirect,
    };
};

const AuthProvider = ({
    children,
    firebaseApp,
}: {
    children: ReactNode;
    firebaseApp: FirebaseApp;
}) => {
    const auth = useProvideAuth({ firebaseApp });
    return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

interface UseAuthProps {
    redirectTo?: string;
    redirectToIfNotAdmin?: string;
}

const useAuth = (props: UseAuthProps = {}) => {
    /* eslint-disable @typescript-eslint/no-unused-vars*/
    const { user, loading, login, loginAndRedirect, logout, logoutAndRedirect } =
        useContext(authContext);
    /* eslint-enable @typescript-eslint/no-unused-vars*/
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        //user is null when explicitly unset i.e. signed out or no token
        if (user === null && props && props.redirectTo && !redirecting) {
            setRedirecting(true);
            console.log("No user present, redirecting to", props.redirectTo);
        } else if (user && props && props.redirectToIfNotAdmin && !redirecting) {
            setRedirecting(true);
            console.log(
                "Logged in user isn't an admin, redirecting to",
                props.redirectToIfNotAdmin
            );
        }
    }, [props, user, redirecting]);

    return useContext(authContext);
};

export { AuthProvider };
export default useAuth;

//https://github.com/vercel/next.js/blob/canary/examples/with-firebase-authentication/components/FirebaseAuth.js
