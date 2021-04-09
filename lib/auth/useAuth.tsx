import React, { useEffect, useState, useContext, createContext, ReactNode } from "react";
import { useRouter } from "next/router";

import firebase from "firebase/app";
import "firebase/auth";

import { AuthContextValues, FbUser } from "./authTypes";
import { mapUserData } from "./mapUserData";

const authContext = createContext<AuthContextValues>(null);

const useProvideAuth = () => {
    const [user, setUser] = useState<FbUser>();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    //Promise-style login method
    const login = async (email: string, password: string) => {
        console.log("Trying to login with email", email);
        await firebase.auth().signInWithEmailAndPassword(email, password);
    };

    //Logs user in, then automatically redirects to the chosen page
    const loginAndRedirect = async (email: string, password: string, redirectTo: string) => {
        try {
            await login(email, password);
            router.push(redirectTo);
        } catch (error) {
            console.error("Failed to login", error);
            throw error;
        }
    };

    //Promise-style logout method
    const logout = async () => {
        return new Promise<void>((resolve, reject) => {
            try {
                firebase.auth().signOut().then(resolve);
            } catch (error) {
                reject(error);
            }
        });
    };

    //Logs user out, then automatically redirects to the chosen page
    const logoutAndRedirect = async (redirectTo: string) => {
        console.log("Logging out");
        return firebase
            .auth()
            .signOut()
            .then(() => {
                // Sign-out successful.
                console.log("Logout success, redirecting to ", redirectTo);
                if (redirectTo) router.push(redirectTo);
            })
            .catch(e => {
                console.error("Logout failed", e);
                throw e;
            });
    };
    // Firebase updates the id token every hour, this
    // makes sure the react state and the cookie are
    // both kept up to date
    useEffect(() => {
        console.log("Adding listener");
        const cancelAuthListener = firebase.auth().onAuthStateChanged(async user => {
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

const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const auth = useProvideAuth();
    return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

interface UseAuthProps {
    redirectTo?: string;
    redirectToIfNotAdmin?: string;
}

const useAuth = (props: UseAuthProps = {}): AuthContextValues => {
    /* eslint-disable @typescript-eslint/no-unused-vars*/
    const { user, loading, login, loginAndRedirect, logout, logoutAndRedirect } = useContext(
        authContext
    );
    /* eslint-enable @typescript-eslint/no-unused-vars*/
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        //user is null when explicitly unset i.e. signed out or no token
        if (user === null && props && props.redirectTo && !redirecting) {
            setRedirecting(true);
            console.log("No user present, redirecting to", props.redirectTo);
            router.push(props.redirectTo);
        } else if (user && props && props.redirectToIfNotAdmin && !redirecting) {
            setRedirecting(true);
            console.log(
                "Logged in user isn't an admin, redirecting to",
                props.redirectToIfNotAdmin
            );
            router.push(props.redirectToIfNotAdmin);
        }
    }, [props, user, redirecting, router]);

    return useContext(authContext);
};

export { AuthProvider };
export default useAuth;

//https://github.com/vercel/next.js/blob/canary/examples/with-firebase-authentication/components/FirebaseAuth.js
