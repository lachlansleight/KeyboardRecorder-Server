import Link from "next/link";

import style from "./Header.module.scss";

const Header = (): JSX.Element => {
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
                </ul>
            </div>
        </div>
    );
};

export default Header;
