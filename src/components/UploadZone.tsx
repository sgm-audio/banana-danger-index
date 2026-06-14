import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "../lib/utils";

interface UploadZoneProps {
  onImageUpload: (file: File, dataUrl: string) => void;
}

export function UploadZone({ onImageUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        onImageUpload(file, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 transition-all duration-300 group",
          isDragging
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.02]"
            : preview
              ? "border-muted-foreground/20 bg-muted/30"
              : "border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 z-10 rounded-full bg-background border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <img
                src={preview}
                alt="Banana peel preview"
                className="mx-auto max-h-48 rounded-xl object-contain shadow-lg"
              />
              <p className="text-xs text-muted-foreground text-center mt-3">
                Click or drag to replace
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={
                  isDragging
                    ? { scale: 1.2, rotate: [0, -10, 10, -10, 0] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-muted p-4"
              >
                {isDragging ? (
                  <ImageIcon className="h-10 w-10 text-primary" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </motion.div>
              <div className="text-center">
                <p className="font-medium text-sm">
                  {isDragging
                    ? "Drop your peel here"
                    : "Drop a banana peel image here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse · PNG, JPG, WEBP
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
