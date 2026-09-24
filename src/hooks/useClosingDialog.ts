import { useCallback, useState } from "react";
// Dialogs here are mounted by their parent and removed through onClosed. If the
// parent unmounted them straight away, the exit animation would never play, so
// the dialog first closes itself and reports back once Radix has finished with
// it (onCloseAutoFocus fires after the closing content unmounts).
export function useClosingDialog(onClosed: () => void) {
  const [open, setOpen] = useState(true);
  const close = useCallback(() => setOpen(false), []);
  return {
    close,
    rootProps: {
      open,
      onOpenChange: (next: boolean) => {
        if (!next) setOpen(false);
      },
    },
    contentProps: { onCloseAutoFocus: onClosed },
  };
}
