import {JSXElementConstructor, ReactElement, useEffect, useRef, useState} from 'react'
import {FaFire} from 'react-icons/fa'
import {FiMenu, FiPlus, FiTrash} from 'react-icons/fi'
import {motion} from 'framer-motion'
import Dragster from './Dragster'
import {LexoRank} from 'lexorank'
import Droppable, {DropProps} from './lib/Droppable'
import Draggable from './lib/Draggable'
import {DragDropContext} from './lib/DragDropContext'

const generateRandomLexoRank = () => {
	const characters = 'abcdefghijklmnopqrstuvwxyz'
	let result = ''
	for (let i = 0; i < 6; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return LexoRank.parse(`0|${result}`)
}

class ColumnClass {
	id: string = crypto.randomUUID()
	title: string
	rank: LexoRank = generateRandomLexoRank()
	constructor(title: string) {
		this.title = title
	}
}

const defaultColumns = [new ColumnClass('Spots'), new ColumnClass('Doing'), new ColumnClass('Stopped')]

class CardClass {
	id: string = crypto.randomUUID()
	title: string
	column: string = defaultColumns[Math.floor(Math.random() * (defaultColumns.length - 1))].id
	rank: LexoRank = generateRandomLexoRank()
	constructor(title: string) {
		this.title = title
	}
}

const defaultTasks = [
	new CardClass('Peace'),
	new CardClass('Bring It'),
	new CardClass('Hotdogs'),
	new CardClass('Sandwich'),
	new CardClass('Stop'),
	new CardClass('Pours'),
	new CardClass('Oranges'),
	new CardClass('Start Running'),
	new CardClass('The Blues'),
	new CardClass('Forgery'),
]

export default function Board() {
	const [cards, setCards] = useState(defaultTasks.sort((a, b) => a.rank.compareTo(b.rank)))
	const [columns, setColumns] = useState(defaultColumns.sort((a, b) => a.rank.compareTo(b.rank)))

	const onDrop = (info: DropProps) => {
		console.log(info)

		const payload = cards.find((card) => card.id === info.dragId)
		if (!payload) return
		const cardsCopy = [...cards].filter((card) => card.id !== info.dragId)
		payload.column = info.to.droppableId

		// update the rank here to whatever
		// const above = cards.filter((card) => card.column === info.to.droppableId)[info.to.index - 1]
		// const below = cards.filter((card) => card.column === info.to.droppableId)[info.to.index]
		// console.log(above, below)

		cardsCopy.push(payload)
		setCards(cardsCopy.sort((a, b) => a.rank.compareTo(b.rank)))
	}

	const getPlaceholder = (element: HTMLElement, type: string) => {
		return (
			<div
				className="bg-violet-700 rounded w-full transition-transform"
				style={{height: element.clientHeight, width: element.clientWidth}}></div>
		)
	}

	return (
		<div className="h-screen w-screen flex gap-3 p-12">
			<DragDropContext placeholder={getPlaceholder}>
				{columns.map((column) => (
					<Droppable key={column.id} droppableId={column.id} accepts="task" onDrop={onDrop}>
						{(provided, snapshot) => (
							<div
								{...provided.droppableProps}
								className="w-56 shrink-0 h-fit overflow-y-scroll p-3 bg-violet-400 rounded flex gap-1 flex-col items-center">
								{cards
									.filter((task) => task.column === column.id)
									.map((task) => (
										<Draggable key={task.id} draggableProps={provided.draggableProps} type="task" dragId={task.id}>
											{(provided, snapshot) => (
												<div
													{...provided.draggableProps}
													className={`w-full  h-8 gap-4 shrink-0 flex items-center p-2 bg-white rounded text-gray-800 text-xs`}>
													<div className="draghandle">
														<FiMenu />
													</div>
													{task.title}
												</div>
											)}
										</Draggable>
									))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				))}

				<Droppable key={'burn'} droppableId="burn" accepts="task" onDrop={() => console.log('You are deleting me')}>
					{(provided, snapshot) => (
						<div
							{...provided.droppableProps}
							className={`w-56 shrink-0 h-56 text-3xl flex justify-center items-center  rounded border-2  border-solid ${
								snapshot.isDraggingOver
									? 'bg-red-500/20 border-red-600 text-red-500'
									: 'bg-slate-500/20 border-slate-600 text-slate-500'
							}`}>
							{snapshot.isDraggingOver ? <FaFire className="animate-bounce" /> : <FiTrash />}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		</div>
	)
}
