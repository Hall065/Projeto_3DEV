import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

export interface KanbanColumnDef<TCol extends string> {
  id: TCol
  label: string
  dot: string
  headerBg: string
}

type ItemWithId = { id: number }

export function GridKanbanBoard<TItem extends ItemWithId, TCol extends string>({
  columns,
  items,
  getColumnId,
  applyColumn,
  onItemsChange,
  onItemMove,
  renderCard,
  renderOverlayCard,
  columnFooter,
  columnsGridClass = 'lg:grid-cols-3',
  canDragItem,
  canDropToColumn,
}: {
  columns: KanbanColumnDef<TCol>[]
  items: TItem[]
  getColumnId: (item: TItem) => TCol
  applyColumn: (item: TItem, column: TCol) => TItem
  onItemsChange: (items: TItem[]) => void
  onItemMove: (itemId: number, toColumn: TCol) => void | Promise<void>
  renderCard: (item: TItem, opts: { isDragging: boolean }) => ReactNode
  renderOverlayCard?: (item: TItem) => ReactNode
  columnFooter?: (columnId: TCol) => ReactNode
  columnsGridClass?: string
  canDragItem?: (item: TItem) => boolean
  canDropToColumn?: (item: TItem, fromColumn: TCol, toColumn: TCol) => boolean
}) {
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns])
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [localItems, setLocalItems] = useState(items)
  const [dragStartColumn, setDragStartColumn] = useState<TCol | null>(null)

  useEffect(() => {
    if (activeId === null) setLocalItems(items)
  }, [items, activeId])

  useEffect(() => {
    document.body.classList.toggle('is-dragging', activeId !== null)
    return () => document.body.classList.remove('is-dragging')
  }, [activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeItem = activeId != null ? localItems.find((i) => i.id === activeId) : undefined

  const findContainer = (id: UniqueIdentifier): TCol | undefined => {
    if (columnIds.includes(id as TCol)) return id as TCol
    const item = localItems.find((i) => i.id === id)
    return item ? getColumnId(item) : undefined
  }

  const itemsByColumn = useMemo(() => {
    const map = Object.fromEntries(columnIds.map((id) => [id, [] as TItem[]])) as Record<TCol, TItem[]>
    for (const item of localItems) {
      const col = getColumnId(item)
      if (map[col]) map[col].push(item)
    }
    return map
  }, [localItems, columnIds, getColumnId])

  const handleDragStart = (event: DragStartEvent) => {
    const col = findContainer(event.active.id)
    setActiveId(event.active.id)
    setDragStartColumn(col ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(active.id)
    const overContainer =
      findContainer(over.id) ?? (columnIds.includes(over.id as TCol) ? (over.id as TCol) : undefined)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    const dragged = localItems.find((i) => i.id === active.id)
    if (dragged && canDropToColumn && !canDropToColumn(dragged, activeContainer, overContainer)) {
      return
    }

    setLocalItems((prev) => {
      const activeIndex = prev.findIndex((i) => i.id === active.id)
      if (activeIndex < 0) return prev

      const updated = applyColumn(prev[activeIndex], overContainer)
      const without = prev.filter((i) => i.id !== active.id)

      const overIndex = columnIds.includes(over.id as TCol)
        ? without.length
        : without.findIndex((i) => i.id === over.id)

      if (overIndex < 0) return [...without, updated]
      return [...without.slice(0, overIndex), updated, ...without.slice(overIndex)]
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const startedCol = dragStartColumn

    setActiveId(null)
    setDragStartColumn(null)

    if (!over) {
      setLocalItems(items)
      return
    }

    const activeContainer = findContainer(active.id)
    const overContainer =
      findContainer(over.id) ?? (columnIds.includes(over.id as TCol) ? (over.id as TCol) : undefined)

    if (!activeContainer || !overContainer) return

    let nextItems = localItems

    if (activeContainer === overContainer) {
      const inColumn = localItems.filter((i) => getColumnId(i) === activeContainer)
      const oldIndex = inColumn.findIndex((i) => i.id === active.id)
      const newIndex = columnIds.includes(over.id as TCol)
        ? inColumn.length - 1
        : inColumn.findIndex((i) => i.id === over.id)

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        const reordered = arrayMove(inColumn, oldIndex, newIndex)
        const rest = localItems.filter((i) => getColumnId(i) !== activeContainer)
        nextItems = [...rest, ...reordered]
      }
    }

    setLocalItems(nextItems)
    onItemsChange(nextItems)

    const finalItem = nextItems.find((i) => i.id === active.id)
    const endCol = finalItem ? getColumnId(finalItem) : overContainer

    if (startedCol && endCol && startedCol !== endCol) {
      const movedItem = nextItems.find((i) => i.id === active.id)
      if (movedItem && canDropToColumn && !canDropToColumn(movedItem, startedCol, endCol)) {
        setLocalItems(items)
        onItemsChange(items)
        return
      }
      void onItemMove(Number(active.id), endCol)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDragStartColumn(null)
    setLocalItems(items)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`grid w-full min-w-0 grid-cols-1 gap-4 [&>*]:min-w-0 ${columnsGridClass}`}>
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            count={itemsByColumn[col.id]?.length ?? 0}
            itemIds={(itemsByColumn[col.id] ?? []).map((i) => i.id)}
            footer={columnFooter?.(col.id)}
          >
            {(itemsByColumn[col.id] ?? []).map((item) => (
              <SortableKanbanCard
                key={item.id}
                id={item.id}
                disabled={canDragItem ? !canDragItem(item) : false}
              >
                {renderCard(item, { isDragging: activeId === item.id })}
              </SortableKanbanCard>
            ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 280, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
        {activeItem ? (
          <div className="kanban-overlay-card cursor-grabbing">
            {(renderOverlayCard ?? renderCard)(activeItem, { isDragging: true })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn<TCol extends string>({
  column,
  count,
  itemIds,
  children,
  footer,
}: {
  column: KanbanColumnDef<TCol>
  count: number
  itemIds: number[]
  children: ReactNode
  footer?: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`glass-panel flex min-w-0 flex-col rounded-2xl transition-all duration-300 ease-out ${
        isOver ? 'ring-2 ring-hub-red/35 ring-offset-2 ring-offset-transparent' : ''
      }`}
    >
      <div className={`flex items-center gap-2 rounded-t-2xl px-4 py-3 transition-colors duration-300 ${column.headerBg}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
        <h2 className="font-semibold text-hub-navy">{column.label}</h2>
        <span className="glass-panel-solid ml-auto rounded-full px-2 py-0.5 text-xs font-bold text-hub-navy">{count}</span>
      </div>
      <div
        className={`flex min-h-[220px] flex-1 flex-col gap-3 p-3 transition-colors duration-300 ${
          isOver ? 'bg-hub-red/[0.03]' : ''
        }`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        {footer}
      </div>
    </div>
  )
}

function SortableKanbanCard({
  id,
  disabled,
  children,
}: {
  id: number
  disabled?: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'transform 280ms cubic-bezier(0.25, 0.8, 0.25, 1)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-sortable-card touch-none ${
        disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-35' : 'opacity-100'}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
