import styled from 'styled-components';

export const GAP = 16;
export const ROW_HEIGHT = 20;

interface StyledWidgetGridProps {
  $height: number;
}

export const StyledWidgetGrid = styled.div<StyledWidgetGridProps>`
  position: relative;
  width: 100%;
  height: ${({ $height }) => $height}px;
  transition: height 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 350px;
`;

export const GridBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: ${GAP}px;
  pointer-events: none;
  z-index: 0;
`;

export const GridColPattern = styled.div`
  background: rgba(73, 69, 255, 0.02);
  border-left: 1px dashed rgba(73, 69, 255, 0.08);
  border-right: 1px dashed rgba(73, 69, 255, 0.08);
  border-radius: 4px;
  height: 100%;
`;

export interface StyledWidgetItemProps {
  $left: number;
  $top: number;
  $width: number;
  $height: number;
  $isEditMode?: boolean;
  $isDragging?: boolean;
  $isResizing?: boolean;
}

export const StyledWidgetItem = styled.div.attrs<StyledWidgetItemProps>((props) => ({
  style: {
    left: `${props.$left}px`,
    top: `${props.$top}px`,
    width: `${props.$width}px`,
    height: `${props.$height}px`,
  },
}))<StyledWidgetItemProps>`
  position: absolute;
  display: flex;
  flex-direction: column;
  min-height: ${ROW_HEIGHT}px;
  transition: ${({ $isDragging, $isResizing }) =>
    $isDragging || $isResizing ? 'none' : 'all 250ms cubic-bezier(0.2, 0.8, 0.2, 1)'};
  z-index: ${({ $isDragging, $isResizing }) => ($isDragging || $isResizing ? 100 : 1)};
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: visible;

  ${({ $isEditMode, $isDragging, theme }) =>
    $isEditMode
      ? `
    border: 1px dashed ${$isDragging ? theme.colors.primary500 : theme.colors.neutral300};
    background: ${$isDragging ? theme.colors.neutral100 : theme.colors.neutral0};
    padding: 6px;
    box-shadow: ${$isDragging ? theme.shadows.filterShadow : 'none'};
    transform: ${$isDragging ? 'scale(1.02)' : 'none'};
    
    &:hover {
      border-color: ${theme.colors.primary500};
      background: ${theme.colors.neutral150 || '#f0f0f5'};
    }
  `
      : `
    width: 100%;
    height: 100%;
  `}
`;

export interface DragPlaceholderProps {
  $left: number;
  $top: number;
  $width: number;
  $height: number;
}

export const DragPlaceholder = styled.div.attrs<DragPlaceholderProps>((props) => ({
  style: {
    left: `${props.$left}px`,
    top: `${props.$top}px`,
    width: `${props.$width}px`,
    height: `${props.$height}px`,
  },
}))<DragPlaceholderProps>`
  position: absolute;
  border: 2px dashed ${({ theme }) => theme.colors.primary500};
  background: rgba(73, 69, 255, 0.08);
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: none;
  z-index: 1;
`;

export const DragGrip = styled.div`
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: grab;
  opacity: 0.3;
  z-index: 10;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }

  &:active {
    cursor: grabbing;
  }

  &::before, &::after {
    content: '';
    display: block;
    width: 18px;
    height: 2px;
    background: currentColor;
    margin: 1px 0;
    border-radius: 1px;
  }
`;

export const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  z-index: 15;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 4px 4px 0;

  &::after {
    content: '';
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 0 8px 8px;
    border-color: transparent transparent ${({ theme }) => theme.colors.neutral400} transparent;
    transition: border-color 0.2s ease;
  }

  &:hover::after {
    border-color: transparent transparent ${({ theme }) => theme.colors.primary500} transparent;
  }
`;

export const EditButtonContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
`;
