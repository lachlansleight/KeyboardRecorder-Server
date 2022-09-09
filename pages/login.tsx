import { useCallback, useState } from "react";
import Button from "components/controls/Button";
import TextField from "components/controls/TextField";
import Layout from "components/layout/Layout";
import useAuth from "lib/hooks/useAuth";

const Login = (): JSX.Element => {
    const { user, loginAndRedirect } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const tryLogin = useCallback(() => {
        if (!email || !password) {
            setError("Please enter an email and password");
            return;
        }
        //validate email with regex
        if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
            setError("Please enter a valid email");
            return;
        }
        const doLogin = async () => {
            setError("");
            try {
                if (loginAndRedirect) await loginAndRedirect(email, password, "/");
            } catch (e: any) {
                setError(e.message);
            }
        };

        doLogin();
    }, [email, password]);

    return (
        <Layout>
            <h1 className="text-4xl mb-4">Login</h1>
            {user ? (
                <div>
                    <p>You are already logged in!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <TextField label="Email" value={email} onChange={setEmail} />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                    />
                    <Button
                        className="bg-primary-800 rounded py-1 grid place-items-center text-lg"
                        onClick={tryLogin}
                    >
                        Login
                    </Button>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                </div>
            )}
        </Layout>
    );
};

export default Login;
