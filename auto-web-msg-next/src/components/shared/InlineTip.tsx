interface InlineTipProps {
  text: string;
}

export default function InlineTip({ text }: InlineTipProps) {
  return <span className="text-xs text-muted-foreground">提示：{text}</span>;
}
