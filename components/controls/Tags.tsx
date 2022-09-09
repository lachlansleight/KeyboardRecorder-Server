import { useCallback, useState } from "react";
import { FaRegTimesCircle } from "react-icons/fa";

const Tags = ({
    value,
    onChange,
    inputClassName,
    tagClassName,
}: {
    value: string[];
    onChange?: (newValue: string[]) => void;
    inputClassName?: string;
    tagClassName?: string;
}): JSX.Element => {
    const [newTag, setNewTag] = useState("");
    const [focus, setFocus] = useState(false);

    const handleDelete = (deleteIndex: number) => {
        if (deleteIndex < 0 || deleteIndex >= value.length) {
            throw new Error(`Index ${deleteIndex} out of range of values ${value.length}`);
        }

        if (onChange) onChange(value.filter((item, index) => index !== deleteIndex));
    };

    const handleAdd = useCallback(() => {
        if (!newTag) return;

        const transformedTag = newTag
            .toLowerCase()
            .replace(/[^a-zA-Z ]/g, "")
            .trim();

        if (value.includes(transformedTag)) {
            setNewTag("");
            return;
        }
        if (onChange) onChange([...value, transformedTag]);
        setNewTag("");
    }, [newTag, onChange]);

    const handleChange = (newVal: string) => {
        if (newVal.includes(",")) {
            handleAdd();
            setNewTag("");
        } else {
            setNewTag(newVal);
        }
    };

    return (
        <>
            <div
                className={`bg-neutral-700 rounded p-1 flex flex-wrap gap-2 ${inputClassName} ${
                    focus ? "ring-1 ring-white" : ""
                }`}
            >
                {value.map((tag, index) => {
                    return (
                        <div
                            key={tag}
                            className={`rounded bg-neutral-800 px-2 flex items-end ${tagClassName}`}
                        >
                            <span>{tag}</span>
                            <button
                                className="ml-2 text-sm focus:outline-none relative"
                                type="button"
                                onClick={() => handleDelete(index)}
                                style={{ bottom: "0.075rem" }}
                            >
                                <FaRegTimesCircle className="text-white hover:text-black mb-1" />
                            </button>
                        </div>
                    );
                })}
                <input
                    className="bg-transparent focus:outline-none"
                    value={newTag}
                    onChange={e => handleChange(e.target.value)}
                    onKeyPress={e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                    onKeyDown={e => {
                        if (e.key === "Backspace" && !newTag && value && value.length > 0) {
                            e.preventDefault();
                            handleDelete(value.length - 1);
                        }
                    }}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                />
            </div>
        </>
    );
};

export default Tags;
