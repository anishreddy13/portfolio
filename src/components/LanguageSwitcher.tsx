"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { motion } from "framer-motion";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'de' : 'en';
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  };

  return (
    <motion.button 
       onClick={toggleLanguage}
       disabled={isPending}
       className={`font-mono text-[0.65rem] tracking-widest px-2 py-1 border transition-colors duration-300 ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
       style={{
          borderColor: "var(--border)",
          color: "var(--text-secondary)",
          background: "var(--surface-1)"
       }}
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
    >
       {locale === 'en' ? 'EN' : 'DE'}
    </motion.button>
  );
}
