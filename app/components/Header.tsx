"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getThread } from "@/app/lib/storage";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(pathname !== "/" && window.history.length > 1);
    }
  }, [pathname]);

  const title = useMemo(() => {
    if (!pathname) return "Factory Chatbot";
    if (pathname === "/chat") return "새 채팅";
    if (pathname.startsWith("/chat/")) {
      const id = pathname.split("/")[2];
      const thread = id ? getThread(id) : undefined;
      return thread?.title ?? "채팅";
    }
    return "Factory Chatbot";
  }, [pathname]);

  return (
    <header className='h-12 flex items-center bg-[#323233] justify-between border-b border-black/10 px-4'>
      <div className='w-10'>
        {canGoBack ? (
          <button className='text-sm text-white' onClick={() => router.back()}>←</button>
        ) : null}
      </div>
      <h1 className='text-base text-white font-semibold truncate max-w-[220px]'>{title}</h1>
      <div className='w-10' />
    </header>
  );
}


