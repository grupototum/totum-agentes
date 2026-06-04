"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AuthSplitScreenProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  loginHref: string;
  error?: string;
  footnote?: React.ReactNode;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function AuthSplitScreen({
  title,
  description,
  imageSrc,
  imageAlt,
  loginHref,
  error,
  footnote,
}: AuthSplitScreenProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-surface md:flex-row">
      {/* Left: form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 md:px-10">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-10"
          >
            {/* Logo */}
            <motion.div variants={itemVariants}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/totum-logo.webp" alt="totum" className="h-7 w-auto" />
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemVariants} className="flex flex-col gap-3">
              <h1 className="text-subheading text-white">{title}</h1>
              <p className="text-base font-light text-text-soft">{description}</p>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                variants={itemVariants}
                className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
                style={{ boxShadow: "inset 0 0 0 1px hsla(0,84%,60%,0.3)" }}
              >
                Falha no login: {error}
              </motion.div>
            )}

            {/* CTA primário */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4">
              <Button asChild size="lg" className="w-full text-base">
                <a href={loginHref}>
                  Entrar com SSO
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Autenticação federada via Keycloak (OAuth + PKCE)
              </div>
            </motion.div>

            {/* Footnote */}
            {footnote && (
              <motion.div
                variants={itemVariants}
                className="text-xs text-muted-foreground"
              >
                {footnote}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, transparent 60%, rgba(14,9,24,0.4) 100%)",
          }}
        />
      </div>
    </div>
  );
}
