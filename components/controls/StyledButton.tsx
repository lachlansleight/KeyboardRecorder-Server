import React, { ReactNode } from "react";
import Button from "./Button";

const StyledButton = ({
    children,
    onClick,
}: {
    children: ReactNode;
    onClick: () => void;
}): JSX.Element => {
    return (
        <Button className="bg-primary-800 text-lg rounded p-2" onClick={onClick}>
            {children}
        </Button>
    );
};

export default StyledButton;
