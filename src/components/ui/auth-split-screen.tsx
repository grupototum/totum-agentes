"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AuthSplitScreenProps {
  logo: React.ReactNode;
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function AuthSplitScreen({
  logo,
  title,
  description,
  imageSrc,
  imageAlt,
  loginHref,
  error,
  footnote,
}: AuthSplitScreenProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row">
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 md:w-1/2">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8"
          >
            <motion.div variants={itemVariants}>{logo}</motion.div>

            <motion.div variants={itemVariants} className="text-left">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </motion.div>

            {error && (
              <motion.div
                variants={itemVariants}
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                Falha no login: {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Button asChild size="lg" className="w-full text-base">
                <a href={loginHref}>
                  Entrar com Keycloak
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Autenticação SSO via realm Totum (OAuth + PKCE)
            </motion.div>

            {footnote && (
              <motion.div variants={itemVariants} className="text-xs text-muted-foreground">
                {footnote}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="relative hidden w-1/2 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    </div>
  );
}
