import packageJson from "package.json";
import Header from "./Header";

import style from "./Layout.module.scss";

const FullscreenLayout = ({ children }: { children: JSX.Element[] | JSX.Element }): JSX.Element => {
    return (
        <div className={style.layout}>
            <Header />
            <main className={style.fullscreen}>{children}</main>
            <footer>
                <div className="container">
                    <p>&copy; KeyboardRecorder 2021</p>
                    <p>Version {packageJson.version}</p>
                </div>
            </footer>
        </div>
    );
};

export default FullscreenLayout;
