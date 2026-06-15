import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Helpers
import { computeBounds, isDescendant } from './helpers';
import { getTranslation } from '../../utils/getTranslation';

// Hooks
import { useIntl } from 'react-intl';

// Strapi
import { Box, Typography, IconButton, Field, Popover } from '@strapi/design-system';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { Cog, Trash } from '@strapi/icons';

// Styles
import {
  StyledWidgetGrid,
  GridBackground,
  GridColPattern,
  StyledWidgetItem,
  DragPlaceholder,
  DragGrip,
  ResizeHandle,
  EditButtonContainer,
  GAP,
  ROW_HEIGHT,
} from './WidgetGrid.style';
import { useTheme } from 'styled-components';

export interface Widget {
  id: string;
  type: string;
  metric: string;
  title: string;
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
}

export interface MetricOption {
  value: string;
  label: string;
}

export interface WidgetGridProps {
  layout: Widget[];
  onChangeLayout: (newLayout: Widget[]) => void;
  editMode: boolean;
  metrics: MetricOption[];
  onUpdateWidget: (id: string, updates: Partial<Widget>) => void;
  onDeleteWidget: (id: string) => void;
  renderWidget: (widget: Widget) => React.ReactNode;
}

// Collision helper
const collides = (
  a: { colStart: number; colSpan: number; rowStart: number; rowSpan: number },
  b: { colStart: number; colSpan: number; rowStart: number; rowSpan: number }
) => {
  if (a.colStart >= b.colStart + b.colSpan) return false;
  if (a.colStart + a.colSpan <= b.colStart) return false;
  if (a.rowStart >= b.rowStart + b.rowSpan) return false;
  if (a.rowStart + a.rowSpan <= b.rowStart) return false;
  return true;
};

// Layout compaction algorithm
export const compactLayout = (widgets: Widget[], activeWidget?: Widget): Widget[] => {
  const sorted = [...widgets].sort((a, b) => {
    if (a.rowStart !== b.rowStart) {
      return a.rowStart - b.rowStart;
    }
    return a.colStart - b.colStart;
  });

  const placed: Widget[] = [];

  if (activeWidget) {
    placed.push(activeWidget);
  }

  for (const widget of sorted) {
    if (activeWidget && widget.id === activeWidget.id) {
      continue;
    }

    const copy = { ...widget };
    copy.rowStart = 1;

    while (placed.some((p) => collides(p, copy))) {
      copy.rowStart++;
    }

    placed.push(copy);
  }

  return widgets.map((w) => placed.find((p) => p.id === w.id) || w);
};

export const WidgetGrid = ({
  layout,
  onChangeLayout,
  editMode,
  metrics,
  onUpdateWidget,
  onDeleteWidget,
  renderWidget,
}: WidgetGridProps) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const editContainerRef = useRef<HTMLDivElement>(null);
  const editPopoverRef = useRef<HTMLDivElement>(null);

  const [activeDragState, setActiveDragState] = useState<Widget | null>(null);
  const [activeResizeState, setActiveResizeState] = useState<Widget | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const rowHeightWithGap = ROW_HEIGHT + GAP;

  /**
   * Handle widget dragging
   * @param e mouse event object
   * @param widget target widget to drag
   * @returns
   */
  const startDrag = useCallback(
    (e: React.MouseEvent, widget: Widget) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('.popover-trigger') ||
        target.closest('[role="dialog"]') ||
        target.closest('input') ||
        target.closest('select')
      ) {
        return;
      }
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const colWidthWithGap = (containerRect.width + GAP) / 12;
      const rowHeightWithGap = ROW_HEIGHT + GAP;

      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const clickCol = Math.floor(mouseX / colWidthWithGap) + 1;
      const clickRow = Math.floor(mouseY / rowHeightWithGap) + 1;

      const offsetCol = clickCol - widget.colStart;
      const offsetRow = clickRow - widget.rowStart;

      const initialClientX = e.clientX;
      const initialClientY = e.clientY;
      const initialWidgetLeft = (widget.colStart - 1) * colWidthWithGap;
      const initialWidgetTop = (widget.rowStart - 1) * rowHeightWithGap;

      let targetColStart = widget.colStart;
      let targetRowStart = widget.rowStart;

      setActiveDragState({
        ...widget,
        _dragLeft: initialWidgetLeft,
        _dragTop: initialWidgetTop,
      } as any);

      /**
       *
       * @param moveEvent
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const mouseX = moveEvent.clientX - containerRect.left;
        const mouseY = moveEvent.clientY - containerRect.top;
        const mouseCol = Math.floor(mouseX / colWidthWithGap) + 1;
        const mouseRow = Math.floor(mouseY / rowHeightWithGap) + 1;

        targetColStart = Math.max(1, Math.min(12 - widget.colSpan + 1, mouseCol - offsetCol));
        targetRowStart = Math.max(1, mouseRow - offsetRow);

        setActiveDragState({
          ...widget,
          colStart: targetColStart,
          rowStart: targetRowStart,
          _dragLeft: initialWidgetLeft + (moveEvent.clientX - initialClientX),
          _dragTop: initialWidgetTop + (moveEvent.clientY - initialClientY),
        } as any);

        const activeCoords = {
          ...widget,
          colStart: targetColStart,
          rowStart: targetRowStart,
        };

        onChangeLayout(compactLayout(layout, activeCoords));
      };

      /**
       *
       */
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setActiveDragState(null);

        const finalized = layout.map((w) =>
          w.id === widget.id ? { ...w, colStart: targetColStart, rowStart: targetRowStart } : w
        );
        onChangeLayout(compactLayout(finalized));
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [layout, onChangeLayout]
  );

  /**
   * Handle widget resizing
   * @param e mouse event object
   * @param widget target widget to resize
   */
  const startResize = useCallback(
    (e: React.MouseEvent, widget: Widget) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const colWidthWithGap = (containerRect.width + GAP) / 12;
      const rowHeightWithGap = ROW_HEIGHT + GAP;

      const initialClientX = e.clientX;
      const initialClientY = e.clientY;
      const initialWidth = widget.colSpan * colWidthWithGap - GAP;
      const initialHeight = widget.rowSpan * rowHeightWithGap - GAP;

      let targetColSpan = widget.colSpan;
      let targetRowSpan = widget.rowSpan;

      setActiveResizeState({
        ...widget,
        _resizeWidth: initialWidth,
        _resizeHeight: initialHeight,
      } as any);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - initialClientX;
        const deltaY = moveEvent.clientY - initialClientY;

        const currentWidth = Math.max(colWidthWithGap * 2 - GAP, initialWidth + deltaX);
        const currentHeight = Math.max(ROW_HEIGHT, initialHeight + deltaY);

        targetColSpan = Math.max(
          2,
          Math.min(12 - widget.colStart + 1, Math.round((currentWidth + GAP) / colWidthWithGap))
        );
        targetRowSpan = Math.max(1, Math.round((currentHeight + GAP) / rowHeightWithGap));

        setActiveResizeState({
          ...widget,
          colSpan: targetColSpan,
          rowSpan: targetRowSpan,
          _resizeWidth: currentWidth,
          _resizeHeight: currentHeight,
        } as any);

        const activeCoords = {
          ...widget,
          colSpan: targetColSpan,
          rowSpan: targetRowSpan,
        };
        onChangeLayout(compactLayout(layout, activeCoords));
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setActiveResizeState(null);

        const finalized = layout.map((w) =>
          w.id === widget.id ? { ...w, colSpan: targetColSpan, rowSpan: targetRowSpan } : w
        );
        onChangeLayout(compactLayout(finalized));
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [layout, onChangeLayout]
  );

  // Compute the maximum row number in the layout, considering active drag or resize states
  const maxRow = useMemo(() => {
    let max = 1;
    layout.forEach((w) => {
      const end = w.rowStart + w.rowSpan - 1;
      if (end > max) max = end;
    });

    const active = activeDragState || activeResizeState;
    if (active) {
      const end = active.rowStart + active.rowSpan - 1;
      if (end > max) max = end;
    }
    return max;
  }, [layout, activeDragState, activeResizeState]);

  // memoised column width with gap
  const colWidthWithGap = useMemo(() => (containerWidth + GAP) / 12, [containerWidth]);

  // memoised height
  const calculatedHeight = useMemo(
    () => maxRow * rowHeightWithGap - GAP,
    [maxRow, rowHeightWithGap]
  );

  // memoise active widget
  const activeWidget = useMemo(
    () => activeDragState || activeResizeState,
    [activeDragState, activeResizeState]
  );

  // observe container width changes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <StyledWidgetGrid ref={containerRef} $height={calculatedHeight}>
      {editMode && (
        <GridBackground>
          {Array.from({ length: 12 }).map((_, i) => (
            <GridColPattern key={i} />
          ))}
        </GridBackground>
      )}

      {activeWidget && (
        <DragPlaceholder
          $left={(activeWidget.colStart - 1) * colWidthWithGap}
          $top={(activeWidget.rowStart - 1) * rowHeightWithGap}
          $width={activeWidget.colSpan * colWidthWithGap - GAP}
          $height={activeWidget.rowSpan * rowHeightWithGap - GAP}
        />
      )}

      {layout.map((widget) => {
        const { left, top, width, height, isDragging, isResizing } = computeBounds(
          widget,
          activeDragState as any,
          activeResizeState as any,
          colWidthWithGap,
          rowHeightWithGap
        );

        if (editMode) {
          return (
            <StyledWidgetItem
              key={widget.id}
              $left={left}
              $top={top}
              $width={width}
              $height={height}
              $isEditMode={true}
              $isDragging={isDragging}
              $isResizing={isResizing}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                const isInsidePopover =
                  isDescendant(target, '[role="dialog"]') ||
                  isDescendant(target, 'div[data-radix-popper-content-wrapper]');

                if (isInsidePopover || target.closest('input') || target.closest('select')) return;

                startDrag(e, widget);
              }}
            >
              <DragGrip />
              {renderWidget(widget)}

              <EditButtonContainer ref={editContainerRef}>
                <Popover.Root>
                  <Popover.Trigger>
                    <IconButton
                      label={formatMessage({ id: getTranslation('components.widget-grid.widget-configuration') })}
                    >
                      <Cog />
                    </IconButton>
                  </Popover.Trigger>
                  <Popover.Content sideOffset={4}>
                    <Box
                      padding={3}
                      background="neutral0"
                      shadow="filterShadow"
                      hasRadius
                      ref={editPopoverRef}
                    >
                      <Flex
                        direction="column"
                        gap={3}
                        alignItems="stretch"
                        style={{ minWidth: '250px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Typography variant="delta" fontWeight="bold" textColor="neutral800">
                          {formatMessage({ id: getTranslation('components.widget-grid.widget-configuration') })}
                        </Typography>

                        <Field.Root>
                          <Field.Label>
                            <Typography variant="pi" fontWeight="bold">
                              {formatMessage({ id: getTranslation('components.widget-grid.widget-title') })}
                            </Typography>
                          </Field.Label>
                          <Field.Input
                            type="text"
                            value={widget.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              onUpdateWidget(widget.id, { title: e.target.value });
                            }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>
                            <Typography variant="pi" fontWeight="bold">
                              {formatMessage({ id: getTranslation('components.widget-grid.widget-metric') })}
                            </Typography>
                          </Field.Label>
                          <SingleSelect
                            size="S"
                            value={widget.metric}
                            onChange={(v) => onUpdateWidget(widget.id, { metric: v as string })}
                          >
                            {metrics.map((m) => (
                              <SingleSelectOption key={m.value} value={m.value}>
                                {m.label}
                              </SingleSelectOption>
                            ))}
                          </SingleSelect>
                        </Field.Root>

                        <Flex
                          justifyContent="flex-end"
                          marginTop={2}
                          style={{
                            borderTop: `1px solid ${theme.colors.neutral300}`,
                            paddingTop: '12px',
                          }}
                        >
                          <IconButton
                            label="Delete Widget"
                            onClick={() => onDeleteWidget(widget.id)}
                            variant="danger"
                          >
                            <Trash />
                          </IconButton>
                        </Flex>
                      </Flex>
                    </Box>
                  </Popover.Content>
                </Popover.Root>
              </EditButtonContainer>
              <ResizeHandle onMouseDown={(e) => startResize(e, widget)} />
            </StyledWidgetItem>
          );
        }

        return (
          <StyledWidgetItem key={widget.id} $left={left} $top={top} $width={width} $height={height}>
            {renderWidget(widget)}
          </StyledWidgetItem>
        );
      })}
    </StyledWidgetGrid>
  );
};
