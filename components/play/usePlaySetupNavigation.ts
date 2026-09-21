"use client";

import { useEffect } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";

export function usePlaySetupNavigation(
  isSetupScreen: boolean,
  backToSetup: () => void
) {
  const { setSetupNav } = usePlayPage();

  useEffect(() => {
    setSetupNav((previous) => {
      const nextBackToSetup = isSetupScreen ? null : backToSetup;
      if (
        previous.isSetupScreen === isSetupScreen &&
        previous.backToSetup === nextBackToSetup
      ) {
        return previous;
      }
      return {
        isSetupScreen,
        backToSetup: nextBackToSetup,
      };
    });
  }, [isSetupScreen, backToSetup, setSetupNav]);
}
