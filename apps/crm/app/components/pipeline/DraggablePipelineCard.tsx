'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { PipelineCard, type PipelineCardProps } from './PipelineCard';

type DraggablePipelineCardProps = Omit<PipelineCardProps, 'isOverlay'>;

export function DraggablePipelineCard(props: DraggablePipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.lead.id,
    data: { lead: props.lead },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <PipelineCard
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.4 : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...listeners}
      {...attributes}
      {...props}
    />
  );
}
