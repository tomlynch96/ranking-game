import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Row({ id, index, player, count, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rank-row ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="rank-pos">{index + 1}</span>
      <span className="avatar md">{player.emoji}</span>
      <span className="pname">{player.name}</span>
      <span className="rank-arrows">
        <button
          className="arrow"
          disabled={index === 0}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onMove(index, index - 1); }}
          aria-label="Move up"
        >▲</button>
        <button
          className="arrow"
          disabled={index === count - 1}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onMove(index, index + 1); }}
          aria-label="Move down"
        >▼</button>
      </span>
      <span className="drag-handle">≡</span>
    </li>
  );
}

// Drag-and-drop (or tap the arrows) to order players best -> worst.
export default function RankList({ order, players, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      onChange(arrayMove(order, order.indexOf(active.id), order.indexOf(over.id)));
    }
  };

  const move = (from, to) => onChange(arrayMove(order, from, to));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="rank-labels"><span>🥇 Best</span><span>Worst 💀</span></div>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className="rank-list">
          {order.map((id, i) => (
            <Row
              key={id}
              id={id}
              index={i}
              count={order.length}
              player={players[id]}
              onMove={move}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
