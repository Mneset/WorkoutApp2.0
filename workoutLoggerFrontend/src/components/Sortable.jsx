import React from 'react';
import {
  DndContext,
  closestCenter,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export { arrayMove };

/**
 * Vertical drag-and-drop reorder context. `items` is an array of unique ids
 * (strings or numbers) in current display order. `onReorder(newOrder)` fires
 * once a drag ends, receiving the reordered id array.
 *
 * Drag is started from a handle (see SortableRow's `handleProps`); a short
 * long-press activates touch dragging so it doesn't fight page scrolling.
 */
export function SortableColumn({ items, onReorder, children, className = '' }) {
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * One sortable row. Render-prop provides:
 *  - setNodeRef / style — apply to the row's outer element
 *  - handleProps — spread onto the drag handle element
 *  - isDragging — true while this row is being dragged
 */
export function SortableRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isSorting } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
    opacity: isDragging ? 0.9 : undefined,
  };
  return children({
    setNodeRef,
    style,
    handleProps: { ...attributes, ...listeners },
    isDragging,
    isSorting,
  });
}

/** Six-dot grip icon for drag handles. */
export function GripIcon({ className = '' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}
