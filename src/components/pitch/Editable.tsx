import { useEffect, useRef } from "react";

interface Props {
  value: string;
  editing: boolean;
  onChange: (next: string) => void;
  className?: string;
  as?: "p" | "span" | "h1" | "h3" | "div" | "li" | "td";
  ariaLabel?: string;
}

/**
 * 就地编辑的文字块:编辑态下点击即可修改,失焦写回草稿。
 * 用 contentEditable 而不是 input,避免打断提案的排版。
 */
export function Editable({
  value,
  editing,
  onChange,
  className,
  as = "span",
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as as "span";

  // 外部值变化(切换提案 / 放弃修改)时同步回 DOM
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== value) el.innerText = value;
  }, [value, editing]);

  if (!editing) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as never}
      role="textbox"
      aria-label={ariaLabel ?? "可编辑内容"}
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      onBlur={(event: React.FocusEvent<HTMLElement>) => {
        const next = event.currentTarget.innerText.replace(/\n+$/, "");
        if (next !== value) onChange(next);
      }}
      className={`${className ?? ""} -mx-1 rounded-sm bg-primary/5 px-1 outline-none ring-primary/30 transition-shadow focus:ring-2`}
    >
      {value}
    </Tag>
  );
}
