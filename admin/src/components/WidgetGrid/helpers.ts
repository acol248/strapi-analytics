import { GAP } from './WidgetGrid.style';

// Types
import { Widget } from './WidgetGrid';

interface ActiveWidgetWithTemp extends Widget {
  _dragLeft?: number;
  _dragTop?: number;
  _resizeWidth?: number;
  _resizeHeight?: number;
}

export const computeBounds = (
  widget: Widget,
  activeDrag: ActiveWidgetWithTemp | null,
  activeResize: ActiveWidgetWithTemp | null,
  colW: number,
  rowH: number
) => {
  const isDragging = activeDrag?.id === widget.id;
  const isResizing = activeResize?.id === widget.id;

  const defaultLeft = (widget.colStart - 1) * colW;
  const defaultTop = (widget.rowStart - 1) * rowH;
  const defaultWidth = widget.colSpan * colW - GAP;
  const defaultHeight = widget.rowSpan * rowH - GAP;

  const left = isDragging ? (activeDrag!._dragLeft ?? defaultLeft) : defaultLeft;
  const top = isDragging ? (activeDrag!._dragTop ?? defaultTop) : defaultTop;
  const width = isResizing ? (activeResize!._resizeWidth ?? defaultWidth) : defaultWidth;
  const height = isResizing ? (activeResize!._resizeHeight ?? defaultHeight) : defaultHeight;

  return { left, top, width, height, isDragging, isResizing };
};

/**
 * Checks if a child element exists within a parent container.
 * @param child - The element or selector to search for.
 * @param parentSelector - The CSS selector for the potential parent.
 * @returns True if the child is a descendant of the parent, false otherwise.
 */
export const isDescendant = (child: HTMLElement | string, parentSelector: string): boolean => {
  const element = typeof child === 'string' ? document.querySelector(child) : child;

  if (!element) return false;

  const parent = element.closest(parentSelector);

  return !!(parent && parent !== element);
}
