import packageJson from "package.json";
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
                    <p>&copy; Lachlan Sleight 2022</p>
                    <p>Version {packageJson.version}</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
