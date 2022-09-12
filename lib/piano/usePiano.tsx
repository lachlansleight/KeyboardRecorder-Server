import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { setContext } from "tone";
import { Piano } from "./Piano";
import { PianoOptions } from "./piano/Piano";

const pianoContext = createContext<{ piano: Piano | null; ctx: AudioContext | null }>({
    piano: null,
    ctx: null,
});

const useProvidePiano = ({ options }: { options: Partial<PianoOptions> }) => {
    const [piano, setPiano] = useState<Piano>();
    const [ctx, setCtx] = useState<AudioContext | null>(null);

    useEffect(() => {
        const p = new Piano(options);
        p.toDestination();
        p.load().then(() => {
            console.log("samples loaded!");
        });
        setPiano(p);
    }, []);

    useEffect(() => {
        const audioCtx = new (window.AudioContext || (window as any)["webkitAudioContext"])();
        setContext(audioCtx);
        setCtx(audioCtx);
    }, []);

    return { piano, ctx };
};

const PianoProvider = ({
    options,
    children,
}: {
    options: Partial<PianoOptions>;
    children: ReactNode;
}): JSX.Element => {
    const { piano, ctx } = useProvidePiano({ options });
    return (
        <pianoContext.Provider value={{ piano: piano || null, ctx }}>
            {children}
        </pianoContext.Provider>
    );
};

export { PianoProvider };

const usePiano = (): { piano: Piano | null; ctx: AudioContext | null } => {
    return useContext(pianoContext);
};

export default usePiano;
