/* eslint-disable no-alert */
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

import React, { useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';
import { createBemElement, createBemBlock } from '../../helpers/styleCreators';
import { BoxEntity, Pin } from '../../models/Box';
import useSchemasStore from '../../hooks/useSchemasStore';
import { ModalPortal } from '../util/Portal';
import BoxSettings from './BoxSettings';
import '../../styles/box.scss';
import BoxPin from './BoxPin';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import PinConfigurator from '../pin-configurator/PinConfigurator';

interface Props {
	box: BoxEntity;
	groupsTopOffset?: number;
	titleHeight?: number;
}

export interface BoxMethods {
	updateCoords: () => void;
	kind: string;
}

const Box = ({ box, groupsTopOffset, titleHeight }: Props, ref: React.Ref<BoxMethods>) => {
	const schemasStore = useSchemasStore();
	const connectionStore = useConnectionsStore();

	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [isBoxActive, setIsBoxActive] = React.useState(false);
	const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
	const [editablePin, setEditablePin] = React.useState<Pin | null>(null);

	const boxRef = React.useRef<HTMLDivElement>(null);
	const [pinsRefs, setPinsRefs] = React.useState<React.RefObject<HTMLDivElement>[]>([]);

	React.useEffect(() => {
		setPinsRefs(pinRef =>
			Array(box.spec.pins.length)
				.fill('')
				.map((_, i) => pinRef[i] || React.createRef()));
	}, [box.spec.pins]);

	React.useEffect(() => {
		if (schemasStore.activeBox === box) {
			setIsBoxActive(true);
		} else {
			setIsBoxActive(false);
		}
	}, [schemasStore.activeBox]);

	React.useEffect(() => {
		sendCoords();
	}, [pinsRefs, groupsTopOffset, titleHeight, schemasStore.boxes]);

	useImperativeHandle(
		ref,
		() => ({
			updateCoords: () => {
				sendCoords();
			},
			kind: box.kind,
		}),
		[groupsTopOffset],
	);

	const isBoxConnectable = React.useMemo(
		() => Boolean(connectionStore.connectionChain.find(wrapperBox => wrapperBox.box.name === box.name)),
		[schemasStore.activePin],
	);

	const sendCoords = () => {
		if (pinsRefs.length === box.spec.pins.length) {
			connectionStore.addCoords(
				box.name,
				pinsRefs.map((pinRef, index) => {
					const pinClientRect = pinRef.current?.getBoundingClientRect();
					const leftConnection = {
						connectionOwner: {
							box: box.name,
							pin: box.spec.pins[index].name,
							pinDirection: 'left' as 'left',
							connectionType: box.spec.pins[index]['connection-type'],
						},
						left: pinClientRect ? pinClientRect.left - 20 : 0,
						top: pinClientRect
							? pinClientRect.top
							+ pinClientRect?.height / 2
								- (groupsTopOffset ?? 0)
								- (titleHeight ?? 0)
							: 0,
					};
					const rightConnection = {
						connectionOwner: {
							box: box.name,
							pin: box.spec.pins[index].name,
							pinDirection: 'right' as 'right',
							connectionType: box.spec.pins[index]['connection-type'],
						},
						left: pinClientRect ? pinClientRect.left + pinClientRect.width + 20 : 0,
						top: pinClientRect
							? pinClientRect.top
								+ pinClientRect?.height / 2
								- (groupsTopOffset ?? 0)
								- (titleHeight ?? 0)
							: 0,
					};
					return {
						pin: box.spec.pins[index].name,
						connections: {
							leftConnection,
							rightConnection,
						},
					};
				}),
			);
		}
	};

	const boxClass = createBemBlock('box', isBoxActive ? 'active' : null);

	const settingsIconClassName = createBemElement('box', 'settings-icon', isModalOpen ? 'active' : null);

	const deleteBoxHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		if (window.confirm(`Are you sure you want to delete resource "${box.name}"`)) {
			schemasStore.deleteBox(box.name);
		}
	};

	const getPinDirection = (pin: Pin) => {
		if (isBoxActive) return 'both';

		if (isBoxConnectable) {
			const findedBox = connectionStore.connectionChain.find(wrapperBox => wrapperBox.box.name === box.name);
			if (findedBox) {
				return pin['connection-type'] === schemasStore.activePin?.['connection-type']
					&& !connectionStore.links.some(
						link =>
							link.from.box === schemasStore.activeBox?.name
							&& link.from.pin === schemasStore.activePin?.name
							&& link.to.box === box.name
							&& link.to.pin === pin.name,
					) ? findedBox.direction
					: 'none';
			}
		}
		return 'none';
	};

	const isDotConnected = (pinName: string, direction: 'left' | 'right') => {
		const pinArrows = connectionStore.connections.filter(
			arrow =>
				(arrow.start.connectionOwner.box === box.name && arrow.start.connectionOwner.pin === pinName)
				|| (arrow.end.connectionOwner.box === box.name && arrow.end.connectionOwner.pin === pinName),
		);
		if (direction === 'left') {
			return connectionStore.connectionCoords.some(
				coord =>
					coord[0].box === box.name
					&& coord[0].pin === pinName
					&& pinArrows.some(
						arrow =>
							(arrow.start.left === coord[1].leftConnection.left
								&& arrow.start.top === coord[1].leftConnection.top)
							|| (arrow.end.left === coord[1].leftConnection.left
								&& arrow.end.top === coord[1].leftConnection.top),
					),
			);
		}
		if (direction === 'right') {
			return connectionStore.connectionCoords.some(
				coord =>
					coord[0].box === box.name
					&& coord[0].pin === pinName
					&& pinArrows.some(
						arrow =>
							(arrow.start.left === coord[1].rightConnection.left
								&& arrow.start.top === coord[1].rightConnection.top)
							|| (arrow.end.left === coord[1].rightConnection.left
								&& arrow.end.top === coord[1].rightConnection.top),
					),
			);
		}
		return false;
	};

	return (
		<div
			ref={boxRef}
			className={boxClass}
			onMouseOver={() => {
				if (!schemasStore.activeBox) {
					schemasStore.setActiveBox(box);
					setIsBoxActive(true);
				}
			}}
			onMouseLeave={() => {
				if (!isContextMenuOpen
					&& !editablePin
					&& box.name === schemasStore.activeBox?.name) {
					schemasStore.setActiveBox(null);
					setIsBoxActive(false);
				}
			}}
		>
			<div className="box__header">
				<span className="box__title">{box.name}</span>
				<div className="box__buttons-wrapper">
					<button
						className="box__button"
						onClick={e => {
							e.stopPropagation();
							setIsModalOpen(!isModalOpen);
						}}
					>
						<i className={settingsIconClassName} />
					</button>
					<button className="box__button" onClick={deleteBoxHandler}>
						<i className="box__remove-icon" />
					</button>
				</div>
			</div>
			<div className="box__info-list">
				<div className="box__info">
					<div className="box__info-name">Kind</div>
					<div className="box__info-value">{box.kind}</div>
				</div>
				<div className="box__info">
					<div className="box__info-name">Image name</div>
					<div className="box__info-value">{box.spec['image-name']}</div>
				</div>
			</div>
			<div className="box__pins">
				{box.spec.pins.map((pin, index) => (
					<BoxPin
						key={pin.name}
						ref={pinsRefs[index]}
						pin={pin}
						box={box}
						deletePinConnections={schemasStore.deletePinConnections}
						selectBox={schemasStore.setActiveBox}
						selectPin={schemasStore.setActivePin}
						connectionDirection={getPinDirection(pin)}
						setConnection={connectionStore.setConnection}
						onContextMenuStateChange={isOpen => setIsContextMenuOpen(isOpen)}
						setEditablePin={setEditablePin}
						leftDotVisible={isDotConnected(pin.name, 'left')}
						rightDotVisible={isDotConnected(pin.name, 'right')}
						activeBox={schemasStore.activeBox}
						activePin={schemasStore.activePin}
					/>
				))}
			</div>
			<ModalPortal
				isOpen={isModalOpen}
				closeModal={() => setIsModalOpen(false)}
			>
				<BoxSettings
					box={box}
					configurateBox={schemasStore.configurateBox}
					onClose={() => setIsModalOpen(false)}
					relatedDictionary={
						schemasStore.dictionaryLinksEntity
							? schemasStore
								.dictionaryLinksEntity
								.spec['dictionaries-relation'].filter(link => link.box === box.name)
							: []
					}
					dictionaryNamesList={schemasStore.dictionaryList.map(dictionary => dictionary.name)}
					setEditablePin={pin => {
						setEditablePin(pin);
						setIsModalOpen(false);
					}}
				/>
			</ModalPortal>
			{
				editablePin
				&& <ModalPortal
					isOpen={Boolean(editablePin)}
					closeModal={() => setEditablePin(null)}>
					<PinConfigurator
						pin={editablePin}
						configuratePin={schemasStore.configuratePin}
						boxName={box.name}
						onClose={() => {
							setEditablePin(null);
						}}
					/>
				</ModalPortal>
			}
		</div>
	);
};

export default observer(Box, { forwardRef: true });
