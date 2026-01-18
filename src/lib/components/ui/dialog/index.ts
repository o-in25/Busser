import { Dialog as DialogPrimitive } from "bits-ui";

import Dialog from "./dialog.svelte";
import DialogContent from "./dialog-content.svelte";
import DialogDescription from "./dialog-description.svelte";
import DialogFooter from "./dialog-footer.svelte";
import DialogHeader from "./dialog-header.svelte";
import DialogOverlay from "./dialog-overlay.svelte";
import DialogPortal from "./dialog-portal.svelte";
import DialogTitle from "./dialog-title.svelte";
import DialogTrigger from "./dialog-trigger.svelte";

const DialogClose = DialogPrimitive.Close;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  //
  Dialog as Root,
  DialogClose as Close,
  DialogContent as Content,
  DialogDescription as Description,
  DialogFooter as Footer,
  DialogHeader as Header,
  DialogOverlay as Overlay,
  DialogPortal as Portal,
  DialogTitle as Title,
  DialogTrigger as Trigger,
};
