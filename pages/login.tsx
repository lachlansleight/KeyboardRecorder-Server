import Layout from "components/layout/Layout";
import { useRouter } from "next/router";
import useAuth from "lib/auth/useAuth";
import { ChangeEvent, useState } from "react";

import style from "./login.module.scss";

const Login = (): JSX.Element => {
    const router = useRouter();
    const { user, loginAndRedirect } = useAuth();

    const [data, setData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(data.email)) {
            setError("Email invalid");
            return;
        }

        setError("");
        setLoading(true);
        try {
            await loginAndRedirect(data.email, data.password, "/");
        } catch (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.id]: e.target.value });
    };

    if (user) router.push("/");

    return (
        <Layout>
            <h1>Login</h1>
            <form className={style.loginForm} onSubmit={handleSubmit}>
                <div className={style.control}>
                    <label htmlFor="email">Email</label>
                    <input
                        type="text"
                        id="email"
                        value={data.email}
                        onChange={handleChange}
                        placeholder="Email"
                    />
                </div>
                <div className={style.control}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={data.password}
                        onChange={handleChange}
                    />
                </div>

                {loading ? (
                    <p className={style.loggingIn}>Logging in...</p>
                ) : (
                    <input type="submit" value="Login" />
                )}

                {error ? <p className={style.error}>{error}</p> : null}
            </form>
        </Layout>
    );
};

export default Login;
