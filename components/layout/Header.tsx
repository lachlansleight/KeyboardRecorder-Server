import useAuth from "lib/auth/useAuth";
import Link from "next/link";
import MidiOutputDevice from "../midi/MidiOutputDevice";

import style from "./Header.module.scss";

const Header = (): JSX.Element => {
    const { user, loading, logout } = useAuth();

    return (
        <div className={style.header}>
            <div className="container">
                <Link href="/">
                    <a>Keyboard Recorder</a>
                </Link>
                <ul>
                    <li>
                        <Link href="/">
                            <a>Home</a>
                        </Link>
                    </li>
                    <li>
                        {loading ? (
                            <span>Loading</span>
                        ) : user ? (
                            <button onClick={logout}>Logout</button>
                        ) : (
                            <Link href="/login">
                                <a>Login</a>
                            </Link>
                        )}
                    </li>
                    <li>
                        <MidiOutputDevice />
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Header;
