/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import { observer } from 'mobx-react-lite';
import React, { useImperativeHandle } from 'react';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import useSchemasStore from '../../hooks/useSchemasStore';
import { Connection, Pin } from '../../models/Box';
import BoxPin from './BoxPin';

interface BoxPinsContainerProps {
	pins: Pin[];
	boxName: string;
	isBoxActive: boolean;
	setEditablePin: (pin: Pin) => void;
	groupsTopOffset?: number;
	titleHeight?: number;
}

export interface PinsContainerMethods {
	updateConnections: () => void;
}

const PIN_PADDING = 14;

const BoxPinsContainer = (
	{
		pins,
		boxName,
		isBoxActive,
		setEditablePin,
		groupsTopOffset,
		titleHeight,
	}: BoxPinsContainerProps,
	ref: React.Ref<PinsContainerMethods>,
) => {
	const connectionsStore = useConnectionsStore();
	const schemasStore = useSchemasStore();

	const closedPinRef = React.useRef<HTMLDivElement>(null);
	const pinsAreaRef = React.useRef<HTMLDivElement>(null);

	const [pinsRefs, setPinsRefs] = React.useState<React.RefObject<HTMLDivElement>[]>([]);

	const [isContainerExpanded, setIsContainerExpanded] = React.useState(isBoxActive);
	const [expandedPin, setExpandedPin] = React.useState<Pin | null>(null);
	const [isBoxConnectable, setIsBoxConnectable] = React.useState(false);

	const filteredPins = pins.filter(pin =>
		isBoxConnectable && schemasStore.activePin
			? pin['connection-type'] === schemasStore.activePin['connection-type']
			: true,
	);

	React.useEffect(() => {
		setIsContainerExpanded(isBoxActive);
	}, [isBoxActive]);

	React.useEffect(() => {
		if (isContainerExpanded) {
			setPinsRefs(
				Array(filteredPins.length)
					.fill('')
					.map(() => React.createRef()),
			);
		} else {
			setPinsRefs([]);
		}
	}, [pins, isContainerExpanded]);

	React.useEffect(() => {
		initBoxConnections();
	}, [
		pins,
		pinsRefs,
		expandedPin,
		connectionsStore.links,
		schemasStore.activeBox,
		schemasStore.activePin,
		schemasStore.expandedBox,
	]);

	React.useEffect(() => {
		if (!isContainerExpanded) {
			setExpandedPin(null);
			schemasStore.setExpandedBox(null);
		} else {
			schemasStore.setExpandedBox(schemasStore.activeBox);
		}
	}, [isContainerExpanded]);

	useImperativeHandle(
		ref,
		() => ({
			updateConnections: () => {
				initBoxConnections();
			},
		}),
		[isContainerExpanded, pinsRefs],
	);

	const initBoxConnections = () => {
		if (isContainerExpanded) {
			connectionsStore.addConnection(
				pinsRefs.flatMap((pinRef, index) =>
					getPinConnections(filteredPins[index].name).map((connection, connectionIndex) =>
						getConnection(
							pinRef,
							filteredPins[index],
							connection.name,
							expandedPin ? connectionIndex + 1 : undefined,
						),
					),
				),
			);
		} else {
			connectionsStore.addConnection(
				pins.flatMap(pin =>
					getPinConnections(pin.name).map(connection =>
						getConnection(closedPinRef, pin, connection.name),
					),
				),
			);
		}
	};

	const getConnection = (
		pinRef: React.RefObject<HTMLDivElement>,
		pin: Pin,
		connectionName: string,
		position?: number,
	): Connection => {
		const pinClientRect = pinRef.current?.getBoundingClientRect();

		const leftPinsAmount = getPinLinksBySide(pin, 'left');
		const rightPinsAmount = getPinLinksBySide(pin, 'right');

		const leftTop = pinClientRect
			? pinClientRect.top +
			  (position
					? (pinClientRect.height /
							(leftPinsAmount.in.length + leftPinsAmount.out.length + 1)) *
					  position
					: pinClientRect.height / 2) -
			  (groupsTopOffset ?? 0) -
			  (titleHeight ?? 0)
			: 0;

		const rightTop = pinClientRect
			? pinClientRect.top +
			  (position
					? (pinClientRect.height /
							(rightPinsAmount.in.length + rightPinsAmount.out.length + 1)) *
					  position
					: pinClientRect.height / 2) -
			  (groupsTopOffset ?? 0) -
			  (titleHeight ?? 0)
			: 0;

		return {
			name: connectionName,
			connectionOwner: {
				box: boxName,
				pin: pin.name,
				connectionType: pin['connection-type'],
			},
			coords: {
				leftPoint: {
					left: pinClientRect ? pinClientRect.left - PIN_PADDING : 0,
					top: leftTop,
				},
				rightPoint: {
					left: pinClientRect
						? pinClientRect.left + pinClientRect.width + PIN_PADDING
						: 0,
					top: rightTop,
				},
			},
		};
	};

	const getBoxConnectionsAmount = (direction: 'left' | 'right' | 'both') =>
		pins.reduce(
			(acc, pin) => {
				const pinConnections = getPinLinksBySide(pin, direction);

				acc.in += pinConnections.in.length;
				acc.out += pinConnections.out.length;
				return acc;
			},
			{
				in: 0,
				out: 0,
			},
		);

	const getPinConnections = (pin: string) =>
		connectionsStore.links.filter(
			link =>
				(link.from.box === boxName && link.from.pin === pin) ||
				(link.to.box === boxName && link.to.pin === pin),
		);

	const getPinLinksBySide = (pin: Pin, direction: 'left' | 'right' | 'both') => {
		const areaClientRect = pinsAreaRef.current?.getBoundingClientRect();
		if (!areaClientRect) {
			return {
				in: [],
				out: [],
			};
		}

		let inConnections = connectionsStore.links.filter(
			link => link.to.box === boxName && link.to.pin === pin.name,
		);

		let outConnections = connectionsStore.links.filter(
			link => link.from.box === boxName && link.from.pin === pin.name,
		);

		if (direction !== 'both') {
			inConnections = inConnections.filter(link => {
				const targetConnection = connectionsStore.connections.find(
					connection =>
						connection.name === link.name &&
						connection.connectionOwner.box === link.from.box &&
						connection.connectionOwner.pin === link.from.pin,
				);

				if (!targetConnection) return false;

				return direction === 'left'
					? targetConnection.coords.leftPoint.left <= areaClientRect.left
					: targetConnection.coords.leftPoint.left >= areaClientRect.right;
			});

			outConnections = outConnections.filter(link => {
				const targetConnection = connectionsStore.connections.find(
					connection =>
						connection.name === link.name &&
						connection.connectionOwner.box === link.to.box &&
						connection.connectionOwner.pin === link.to.pin,
				);

				if (!targetConnection) return false;

				return direction === 'left'
					? targetConnection.coords.leftPoint.left <= areaClientRect.left
					: targetConnection.coords.leftPoint.left >= areaClientRect.right;
			});
		}

		return {
			in: inConnections,
			out: outConnections,
		};
	};

	const leftBoxConnectionsAmount = React.useMemo(() => getBoxConnectionsAmount('left'), [
		groupsTopOffset,
		isContainerExpanded,
		connectionsStore.links,
	]);
	const rightBoxConnectionsAmount = React.useMemo(() => getBoxConnectionsAmount('right'), [
		groupsTopOffset,
		isContainerExpanded,
		connectionsStore.links,
	]);

	React.useEffect(() => {
		if (schemasStore.activeBox?.name !== boxName) {
			const isConnectable = Boolean(
				schemasStore.activePin &&
					connectionsStore.connectionChain.find(box => box.name === boxName),
			);
			setIsContainerExpanded(isConnectable);
			setIsBoxConnectable(isConnectable);
		}
	}, [connectionsStore.connectionPinStart]);

	useOutsideClickListener(pinsAreaRef, e => {
		if (
			!e
				.composedPath()
				.some(
					elem =>
						elem instanceof HTMLElement &&
						(elem.className.includes('box__pin') || elem.className.includes('modal')),
				)
		) {
			schemasStore.setActivePin(null);
			setExpandedPin(null);
		}
	});

	return (
		<div ref={pinsAreaRef} className='box__pins-area'>
			{!isContainerExpanded ? (
				<div ref={closedPinRef} className='box__pin'>
					<div className='box__pin-dot left' />
					<span className='box__pin-counter left'>
						{leftBoxConnectionsAmount.in + leftBoxConnectionsAmount.out}
					</span>
					<div className='box__pin-info'>
						<span className='box__pin-name'>
							{`${pins.length} ${pins.length === 1 ? 'Pin' : 'Pins'}`}
						</span>
						<i className='box__pin-icon' />
					</div>
					<span className='box__pin-counter right'>
						{rightBoxConnectionsAmount.in + rightBoxConnectionsAmount.out}
					</span>
					<div className='box__pin-dot right' />
				</div>
			) : (
				filteredPins.map((pin, index) => (
					<BoxPin
						key={pin.name}
						ref={pinsRefs[index]}
						pin={pin}
						setEditablePin={setEditablePin}
						getPinLinks={getPinLinksBySide}
						isPinExpanded={expandedPin ? expandedPin.name === pin.name : false}
						togglePin={isOpen => {
							setExpandedPin(isOpen ? pin : null);
						}}
						isConnectable={
							isBoxConnectable
								? pin['connection-type'] ===
								  schemasStore.activePin?.['connection-type']
								: false
						}
						boxName={boxName}
						groupsTopOffset={groupsTopOffset}
						titleHeight={titleHeight}
					/>
				))
			)}
		</div>
	);
};

export default observer(BoxPinsContainer, { forwardRef: true });
