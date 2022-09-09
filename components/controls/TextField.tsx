const TextField = ({
    className,
    label,
    value,
    onChange,
    type = "text",
}: {
    className?: string;
    label: string;
    value: string;
    onChange?: (value: string) => void;
    type?: string;
}): JSX.Element => {
    return (
        <div className={`w-full flex items-center ${className}`}>
            <label className="w-24">{label}</label>
            <input
                type={type}
                className="flex-grow bg-neutral-700 rounded px-2 py-1"
                value={value}
                onChange={e => {
                    if (onChange) onChange(e.target.value);
                }}
            />
        </div>
    );
};

export default TextField;
