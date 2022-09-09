import { FaCheck } from "react-icons/fa";

const Checkbox = ({
    containerClassName,
    checkClassName,
    checked,
    onChange,
}: {
    containerClassName?: string;
    checkClassName?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}): JSX.Element => {
    const handleClick = () => {
        if (onChange) onChange(checked ? false : true);
    };

    return (
        <div
            className={`inline-grid place-items-center w-8 h-8 bg-neutral-700 border rounded relative cursor-pointer ${containerClassName}`}
            onClick={handleClick}
        >
            {checked ? (
                <FaCheck className={`absolute w-6 h-6 text-yellow-300 ${checkClassName}`} />
            ) : null}
        </div>
    );
};

export default Checkbox;
