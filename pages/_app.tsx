import { AppProps } from "next/app";

import { Router } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import { MidiProvider } from "../lib/midi/useMidi";

import "./index.scss";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
    return (
        <MidiProvider>
            <Component {...pageProps} />
        </MidiProvider>
    );
}

export default MyApp;
