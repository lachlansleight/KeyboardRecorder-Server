import { AppProps } from "next/dist/shared/lib/router/router";
import { ReactNode } from "react";
import "../styles/app.css";
// import "react-datepicker/dist/react-datepicker.css";
import { AuthProvider } from "lib/hooks/useAuth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import initFirebase from "lib/initFirebase";
import { MidiProvider } from "lib/midi/useMidi";
import { PianoProvider } from "lib/piano/usePiano";

function MyApp({ Component, pageProps }: AppProps): ReactNode {
    const firebaseApp = initFirebase();

    return (
        <AuthProvider firebaseApp={firebaseApp}>
            <MidiProvider>
                <PianoProvider options={{ velocities: 3 }}>
                    <Component {...pageProps} />
                </PianoProvider>
            </MidiProvider>
        </AuthProvider>
    );
}

export default MyApp;
