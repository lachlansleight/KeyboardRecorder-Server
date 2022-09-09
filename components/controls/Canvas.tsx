import { useEffect, useRef } from "react";

const Canvas = ({
    className = "",
    width,
    height,
    onRender,
}: {
    className?: string;
    width: number;
    height: number;
    onRender: (canvas: HTMLCanvasElement) => void;
}): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        onRender(canvasRef.current);
    }, [canvasRef, onRender]);

    return <canvas ref={canvasRef} className={className} width={width} height={height} />;
};

export default Canvas;
