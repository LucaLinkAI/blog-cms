"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ShareWechatProps {
  url: string;
  title: string;
}

export function ShareWechat({ url, title }: ShareWechatProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-[#07C160] border-[#07C160]/40 hover:bg-[#07C160]/10 hover:text-[#07C160] hover:border-[#07C160]"
          aria-label="Share to WeChat"
        >
          {/* WeChat logo */}
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-5.972 2.932-7.715 1.488-.943 3.255-1.384 5.09-1.234C17.012 4.498 13.326 2.188 8.69 2.188zm-1.99 3.58a.96.96 0 0 1 .96.96.96.96 0 0 1-.96.96.96.96 0 0 1-.96-.96.96.96 0 0 1 .96-.96zm4.069 0a.96.96 0 0 1 .96.96.96.96 0 0 1-.96.96.96.96 0 0 1-.96-.96.96.96 0 0 1 .96-.96zm3.814 2.895c-4.217 0-7.637 2.878-7.637 6.43 0 3.55 3.42 6.43 7.637 6.43.981 0 1.92-.156 2.797-.435a.72.72 0 0 1 .6.082l1.584.927a.272.272 0 0 0 .14.046.246.246 0 0 0 .242-.248c0-.06-.024-.12-.04-.178l-.326-1.234a.493.493 0 0 1 .178-.556C22.047 19.077 24 17.352 24 15.093c0-3.552-3.42-6.43-7.637-6.43h.021zm-2.69 3.223a.8.8 0 0 1 .8.8.8.8 0 0 1-.8.8.8.8 0 0 1-.8-.8.8.8 0 0 1 .8-.8zm5.38 0a.8.8 0 0 1 .8.8.8.8 0 0 1-.8.8.8.8 0 0 1-.8-.8.8.8 0 0 1 .8-.8z" />
          </svg>
          Share to WeChat
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4 flex flex-col items-center gap-3" side="bottom">
        <p className="text-xs text-center text-muted-foreground leading-snug">
          Scan with WeChat to share
          <br />
          <span className="font-medium text-foreground">"{title}"</span>
        </p>
        <div className="rounded-lg border p-2 bg-white">
          <QRCodeSVG
            value={url}
            size={160}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          WeChat will display the article card with title and cover image
        </p>
      </PopoverContent>
    </Popover>
  );
}
