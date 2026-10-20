"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { ClerkLoaded, UserButton } from "@clerk/nextjs";

type UserButtonProps = ComponentProps<typeof UserButton>;

/**
 * Hydration-safe wrapper for Clerk's UserButton.
 *
 * During SSR and initial client hydration tick, renders null consistently so that
 * the server-rendered HTML matches the client VDOM. Once mounted on the client,
 * renders UserButton safely inside ClerkLoaded.
 */
export function SafeUserButton(props: UserButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ClerkLoaded>
      <UserButton {...props} />
    </ClerkLoaded>
  );
}

export default SafeUserButton;
