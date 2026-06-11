"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileUploaderProps {
  headers: string[];
  mappingLink: string;
  setMappingLink: (val: string) => void;
  mappingMessage: string;
  setMappingMessage: (val: string) => void;
  handleFileChange: (file: File | null) => void;
}

export function FileUploader({
  headers,
  mappingLink,
  setMappingLink,
  mappingMessage,
  setMappingMessage,
  handleFileChange,
}: FileUploaderProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="task-file">任务文件（列：链接 / 话术）</Label>
        <Input
          id="task-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {headers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 rounded-md border p-4 bg-muted/20">
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center justify-between">
              <span>「链接」列映射</span>
              {mappingLink && !mappingLink.includes("auto") && (
                <span className="text-xs text-primary font-normal">已指定</span>
              )}
            </Label>
            <Select
              value={mappingLink || "auto"}
              onValueChange={(v) => setMappingLink(v === "auto" ? "" : v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="未匹配（请手动指定）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="text-muted-foreground">默认关联</span>
                </SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center justify-between">
              <span>「话术」列映射</span>
              {mappingMessage && !mappingMessage.includes("auto") && (
                <span className="text-xs text-primary font-normal">已指定</span>
              )}
            </Label>
            <Select
              value={mappingMessage || "auto"}
              onValueChange={(v) => setMappingMessage(v === "auto" ? "" : v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="未匹配（请手动指定）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="text-muted-foreground">默认关联</span>
                </SelectItem>
                {headers.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </>
  );
}
