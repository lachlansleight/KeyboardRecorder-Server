import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Piano } from "./Piano";
import { PianoOptions } from "./piano/Piano";

const pianoContext = createContext<Piano | null>(null);

const useProvidePiano = ({ options }: { options: Partial<PianoOptions> }) => {
    const [piano, setPiano] = useState<Piano>();

    useEffect(() => {
        const p = new Piano(options);
        p.toDestination();
        p.load().then(() => {
            console.log("samples loaded!");
        });
        setPiano(p);
    }, []);

    return piano;
};

const PianoProvider = ({
    options,
    children,
}: {
    options: Partial<PianoOptions>;
    children: ReactNode;
}): JSX.Element => {
    const piano = useProvidePiano({ options });
    return <pianoContext.Provider value={piano || null}>{children}</pianoContext.Provider>;
};

export { PianoProvider };

const usePiano = (): Piano | null => {
    return useContext(pianoContext);
};

export default usePiano;
