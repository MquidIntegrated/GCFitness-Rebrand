import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getXsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function ImageUpload({ value, onChange, uploadType, disabled = false }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    async function handleFile(file) {
        setError(null);
        onChange(URL.createObjectURL(file));
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", uploadType);
            const response = await fetch("/admin/uploads", {
                method: "POST",
                body: formData,
                headers: {
                    "X-XSRF-TOKEN": getXsrfToken(),
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Upload failed. Please try again.");
            }
            const { url } = await response.json();
            onChange(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            void handleFile(file);
        }
    }

    return (
        <div className="space-y-2">
            <div
                onClick={disabled ? undefined : () => inputRef.current?.click()}
                onDragOver={disabled ? undefined : (e) => e.preventDefault()}
                onDrop={disabled ? undefined : handleDrop}
                className={cn(
                    "relative flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground",
                    !disabled && "cursor-pointer hover:bg-muted/50",
                    value && "border-solid p-0",
                )}
            >
                {value ? (
                    <img src={value} alt="" className="h-full w-full rounded-lg object-cover" />
                ) : disabled ? (
                    <span>No image</span>
                ) : (
                    <>
                        <ImagePlus className="size-6" />
                        <span>Click or drag an image here</span>
                    </>
                )}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        void handleFile(file);
                    }
                }}
            />
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
