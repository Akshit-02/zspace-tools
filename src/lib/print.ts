/**
 * Prints a single element: clones it into a top-level #print-root (so long
 * content paginates naturally) and hides everything else while printing.
 */
export function printElement(el: HTMLElement, pageName?: string) {
  document.getElementById("print-root")?.remove();
  const root = document.createElement("div");
  root.id = "print-root";
  if (pageName) root.dataset.page = pageName;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.position = "static";
  root.appendChild(clone);
  document.body.appendChild(root);
  document.body.dataset.print = "clone";
  const cleanup = () => {
    root.remove();
    if (document.body.dataset.print === "clone") delete document.body.dataset.print;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  // Safari may not fire afterprint; print() blocks until the dialog closes in most browsers.
  setTimeout(cleanup, 1500);
}
