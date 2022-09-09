import React, { ReactNode } from "react";

const ProgressBar = ({
    className,
    innerClassName,
    progress = 0,
    children,
}: {
    className?: string;
    innerClassName?: string;
    progress?: number;
    children?: ReactNode;
}): JSX.Element => {
    return (
        <div
            className={className}
            style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
            }}
        >
            <div
                className={innerClassName}
                style={{
                    height: "100%",
                    width: `${progress * 100}%`,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transition: "all 0.3s",
                }}
            ></div>
            <div className="relative grid place-items-center">{children}</div>
        </div>
    );
};

export default ProgressBar;
