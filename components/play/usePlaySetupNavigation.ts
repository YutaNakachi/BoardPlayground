"use client";

import { useEffect } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";

export function usePlaySetupNavigation(
  isSetupScreen: boolean,
  backToSetup: () => void
) {
  const { setSetupNav } = usePlayPage();

  useEffect(() => {
    setSetupNav({
      isSetupScreen,
      backToSetup: isSetupScreen ? null : backToSetup,
    });
  }, [isSetupScreen, backToSetup, setSetupNav]);
}
