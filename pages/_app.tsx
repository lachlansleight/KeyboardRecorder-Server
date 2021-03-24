import { AppProps } from "next/app";

import { Router } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import { MidiProvider } from "../lib/midi/useMidi";
import { PianoProvider } from "../lib/piano/usePiano";

import "./index.scss";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
    return (
        <MidiProvider>
            <PianoProvider options={{ velocities: 3 }}>
                <Component {...pageProps} />
            </PianoProvider>
        </MidiProvider>
    );
}

export default MyApp;
