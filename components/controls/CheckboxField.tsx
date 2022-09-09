import Checkbox from "./Checkbox";

const CheckboxField = ({
    className,
    label,
    value,
    onChange,
}: {
    className?: string;
    label: string;
    value: boolean;
    onChange?: (value: boolean) => void;
}): JSX.Element => {
    return (
        <div className={`w-full flex items-center ${className}`}>
            <label className="w-24">{label}</label>
            <Checkbox checked={value} onChange={onChange} />
        </div>
    );
};

export default CheckboxField;
