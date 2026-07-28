import { useId, useRef, type ReactNode } from 'react'
import { formatFileSize } from '@/lib/format'
import styles from './UploadPanel.module.css'

interface FilePickFieldProps {
  /** input accept 속성 (예: "video/*", ".csv,text/csv") */
  accept: string
  icon: ReactNode
  /** 파일이 선택되지 않았을 때의 안내 문구 */
  placeholder: string
  hint: string
  file: File | null
  onSelect: (file: File | null) => void
  disabled?: boolean
}

/**
 * 파일 선택 필드.
 * 기본 <input type="file"> 은 모양을 맞추기 어려워 숨기고 버튼으로 트리거한다.
 */
export function FilePickField({
  accept,
  icon,
  placeholder,
  hint,
  file,
  onSelect,
  disabled = false,
}: FilePickFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        className={styles.picker}
        data-selected={Boolean(file)}
        disabled={disabled}
        // 같은 파일을 다시 고르면 change 가 안 뜨므로 value 를 비운 뒤 연다.
        onClick={() => {
          if (inputRef.current) inputRef.current.value = ''
          inputRef.current?.click()
        }}
      >
        <span className={styles.pickerIcon}>{icon}</span>
        <span className={styles.pickerBody}>
          <span className={styles.pickerTitle}>{file ? file.name : placeholder}</span>
          <span className={styles.pickerDesc}>{file ? formatFileSize(file.size) : hint}</span>
        </span>
        {file && <span className={styles.pickerChange}>변경</span>}
      </button>
    </>
  )
}

/** 파일 전송 진행률 바. 서버가 Content-Length 를 못 주면 표시되지 않는다. */
export function UploadProgress({ percent }: { percent: number }) {
  return (
    <div className={styles.progress}>
      <div className={styles.progressHead}>
        <span>파일 전송 중</span>
        <span className="num">{percent}%</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
