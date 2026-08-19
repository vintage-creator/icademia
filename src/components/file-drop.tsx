import { useRef, useState } from "react";
import { UploadCloud, X, FileText, FileImage, FileSpreadsheet, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DroppedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  rawFile?: File;
}

export function FileDrop({
  label,
  hint,
  accept,
  files,
  onChange,
}: {
  label: string;
  hint: string;
  accept?: string;
  files: DroppedFile[];
  onChange: (next: DroppedFile[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      type: f.type || "file",
      rawFile: f,
    }));
    onChange([...files, ...next]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        onClick={() => input.current?.click()}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-6 py-10 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/50"
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-base font-semibold">{label}</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{hint}</p>
        <p className="mt-3 text-xs text-primary">Click to browse · or drop files here</p>
        <input ref={input} type="file" multiple accept={accept} className="hidden" onChange={(e) => add(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <FileGlyph type={f.type} name={f.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">{fmtSize(f.size)}</p>
              </div>
              <button type="button" onClick={() => onChange(files.filter((x) => x.id !== f.id))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileGlyph({ type, name }: { type: string; name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  let Icon = FileIcon;
  if (type.startsWith("image/")) Icon = FileImage;
  else if (["xls", "xlsx", "csv"].includes(ext)) Icon = FileSpreadsheet;
  else if (["pdf", "doc", "docx", "txt"].includes(ext) || type.startsWith("text/")) Icon = FileText;
  return (
    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </span>
  );
}

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
