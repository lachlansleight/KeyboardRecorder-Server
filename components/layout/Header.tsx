import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { FaBars } from "react-icons/fa";
import useAuth from "lib/hooks/useAuth";
import MidiOutputDevice from "components/midi/MidiOutputDevice";

const linkClass = "text-white";
const activeLinkClass = "text-green-300";

const Header = ({ pathName = "/" }: { pathName?: string }): JSX.Element => {
    const headerRef = useRef<HTMLElement>(null);
    const { user } = useAuth();

    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        //make sure dropdown menu is open when window size is greater than 768 (tailwind md breakpoint)
        //this could introduce bugs if we change this breakpoint...
        const handleResize = () => {
            setMenuOpen(window.innerWidth > 768);
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    //close the menu if the user taps anywhere outside of it
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (window.innerWidth > 768) return;

            if (e.target instanceof Node) {
                if (!headerRef.current?.contains(e.target)) {
                    setMenuOpen(false);
                }
            }
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [headerRef.current]);

    return (
        <header
            ref={headerRef}
            className="flex flex-wrap flex-row justify-between items-center h-header md:space-x-4 bg-neutral-800 py-2 px-6 relative"
        >
            <Link href="/">
                <a className="flex flex-row items-center">
                    <span className="ml-3 text-xl font-bold text-white">MIDI Recorder</span>
                </a>
            </Link>
            <button
                aria-expanded={menuOpen}
                className="grid place-items-center inline-block md:hidden w-8 h-8 text-white"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                <FaBars className="text-2xl" />
            </button>
            <nav
                className={`${
                    menuOpen ? "flex" : "hidden"
                } absolute md:relative top-12 left-0 md:top-0 z-20 flex-col md:flex-row md:space-x-6 items-center font-semibold w-full md:w-auto bg-neutral-700 md:bg-transparent p-4 md:p-0 shadow-lg md:shadow-none `}
            >
                <Link href="/">
                    <a className={`${linkClass} ${pathName === "/" ? activeLinkClass : null}`}>
                        Home
                    </a>
                </Link>
                <span className="hidden md:block text-neutral-700">|</span>
                <hr className="block md:hidden my-2 w-full border-neutral-600" />
                {user ? (
                    <></>
                ) : (
                    // <Link href="/dashboard">
                    //     <a
                    //         className={`${linkClass} ${
                    //             pathName === "/dashboard" ? activeLinkClass : null
                    //         }`}
                    //     >
                    //         Dashboard
                    //     </a>
                    // </Link>
                    <Link href="/login">
                        <a
                            className={`${linkClass} ${
                                pathName === "login" ? activeLinkClass : null
                            }`}
                        >
                            Login
                        </a>
                    </Link>
                )}
                <div className="grid place-items-center mt-4 md:ml-4 md:mt-0">
                    <MidiOutputDevice />
                </div>
            </nav>
        </header>
    );
};

export default Header;
