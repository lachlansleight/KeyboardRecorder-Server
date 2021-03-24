import Header from "./Header";

import style from "./Layout.module.scss";

const Layout = ({ children }: { children: JSX.Element[] | JSX.Element }): JSX.Element => {
    return (
        <div className={style.layout}>
            <Header />
            <main>
                <div className="container">{children}</div>
            </main>
            <footer>
                <div className="container">
                    <p>&copy; KeyboardRecorder 2021</p>
                    <p>Version 0.1.0</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
