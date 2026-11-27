import { FileUp, FileText, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { DemoTag } from '@/components/common/misc'
import { ACCEPTED_EXTENSIONS, buildSampleFile, validateFile } from '@/services/importService'
import { cn } from '@/utils/cn'
import { formatBytes } from '@/utils/format'

export function FileDropzone({ file, onFile, error, onError }: { file: File | null; onFile: (f: File | null) => void; error?: string; onError: (e: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const pick = (f: File | undefined) => {
    if (!f) return
    const err = validateFile(f)
    if (err) {
      onError(err)
      onFile(null)
    } else {
      onError('')
      onFile(f)
    }
  }
  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 rounded-[10px] border border-border bg-subtle/60 px-3 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-fg">{file.name}</div>
            <div className="text-[12px] text-fg-3">
              {formatBytes(file.size)} · {file.name.split('.').pop()?.toUpperCase()}
            </div>
          </div>
          <button type="button" onClick={() => onFile(null)} className="rounded-md p-1 text-fg-3 hover:bg-hover hover:text-fg" aria-label="Remove file">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            pick(e.dataTransfer.files[0])
          }}
          className={cn('flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed px-6 py-8 text-center transition-colors', drag ? 'border-primary bg-primary-soft/50' : error ? 'border-error-dot/50' : 'border-border-strong hover:border-fg-3')}
        >
          <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-subtle text-fg-2">
            <FileUp className="size-5" />
          </span>
          <p className="text-[13px] font-medium text-fg">
            Drag a file here or{' '}
            <button type="button" className="text-primary hover:underline" onClick={() => input.current?.click()}>
              browse
            </button>
          </p>
          <p className="mt-1 text-[12px] text-fg-3">CSV, XLIFF, JSON or TXT · up to 5 MB</p>
          <input ref={input} type="file" className="sr-only" accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')} onChange={(e) => pick(e.target.files?.[0] ?? undefined)} aria-label="Choose file to import" />
        </div>
      )}
      {error && (
        <p className="mt-2 text-[12.5px] text-error" role="alert">
          {error}
        </p>
      )}
      {!file && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-fg-2">
          <DemoTag>Demo</DemoTag>
          <span>No file handy? Use a sample:</span>
          {(['csv', 'xliff', 'json', 'txt'] as const).map((k) => (
            <button key={k} type="button" onClick={() => pick(buildSampleFile(k))} className="rounded-md border border-border px-1.5 py-0.5 font-medium text-fg hover:bg-hover">
              .{k}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
