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
import useStore from '../../hooks/useStore';
import { ModalPortal } from '../util/Portal';
import BoxSettings from './BoxSettings';
import '../../styles/box.scss';
import BoxPin from './BoxPin';

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
	const { rootStore } = useStore();
	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [isBoxActive, setIsBoxActive] = React.useState(false);
	const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
	const [isPinConfiguratorOpen, setIsPinConfiguratorOpen] = React.useState(false);

	const boxRef = React.useRef<HTMLDivElement>(null);
	const [pinsRefs, setPinsRefs] = React.useState<React.RefObject<HTMLDivElement>[]>([]);

	React.useEffect(() => {
		setPinsRefs(pinRef =>
			Array(box.spec.pins.length)
				.fill('')
				.map((_, i) => pinRef[i] || React.createRef()));
	}, [box.spec.pins]);

	React.useEffect(() => {
		if (rootStore.activeBox === box) {
			setIsBoxActive(true);
		} else {
			setIsBoxActive(false);
		}
	}, [rootStore.activeBox]);

	React.useEffect(() => {
		sendCoords();
	}, [pinsRefs]);

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
		() => Boolean(rootStore.connectionChain.find(wrapperBox => wrapperBox.box.name === box.name)),
		[rootStore.activePin],
	);

	const sendCoords = () => {
		if (groupsTopOffset && titleHeight && pinsRefs.length === box.spec.pins.length) {
			rootStore.addCoords(
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
							? pinClientRect.top + pinClientRect?.height / 2 - groupsTopOffset - titleHeight
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
							? pinClientRect.top + pinClientRect?.height / 2 - groupsTopOffset - titleHeight
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
			rootStore.deleteBox(box.name);
		}
	};

	const getPinDirection = (pin: Pin) => {
		if (isBoxActive) return 'both';

		if (isBoxConnectable) {
			const findedBox = rootStore.connectionChain.find(wrapperBox => wrapperBox.box.name === box.name);
			if (findedBox) {
				return pin['connection-type'] === rootStore.activePin?.['connection-type']
					&& !rootStore.links.some(
						link =>
							link.from.box === rootStore.activeBox?.name
							&& link.from.pin === rootStore.activePin?.name
							&& link.to.box === box.name
							&& link.to.pin === pin.name,
					) ? findedBox.direction
					: 'none';
			}
		}
		return 'none';
	};

	const isDotConnected = (pinName: string, direction: 'left' | 'right') => {
		const pinArrows = rootStore.connections.filter(
			arrow =>
				(arrow.start.connectionOwner.box === box.name && arrow.start.connectionOwner.pin === pinName)
				|| (arrow.end.connectionOwner.box === box.name && arrow.end.connectionOwner.pin === pinName),
		);
		if (direction === 'left') {
			return rootStore.connectionCoords.some(
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
			return rootStore.connectionCoords.some(
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
				if (!rootStore.activeBox) {
					setIsBoxActive(true);
				}
			}}
			onMouseLeave={() => {
				if (!isContextMenuOpen && !isPinConfiguratorOpen) {
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
						configuratePin={rootStore.configuratePin}
						deletePinConnections={rootStore.deletePinConnections}
						selectBox={rootStore.setActiveBox}
						selectPin={rootStore.setActivePin}
						connectionDirection={getPinDirection(pin)}
						setConnection={rootStore.setConnection}
						onContextMenuStateChange={isOpen => {
							setIsContextMenuOpen(isOpen);
							if (isOpen) {
								rootStore.setActiveBox(null);
								rootStore.setActivePin(null);
							}
						}}
						onPinConfiguratorStateChange={setIsPinConfiguratorOpen}
						leftDotVisible={isDotConnected(pin.name, 'left')}
						rightDotVisible={isDotConnected(pin.name, 'right')}
						activeBox={rootStore.activeBox}
						activePin={rootStore.activePin}
					/>
				))}
			</div>
			<ModalPortal isOpen={isModalOpen}>
				<BoxSettings
					box={box}
					onParamValueChange={rootStore.setBoxParamValue}
					onClose={() => setIsModalOpen(false)}
					addDictionaryRelation={rootStore.addDictionaryRelation}
					changeCustomConfig={rootStore.changeCustomConfig}
					deleteParam={rootStore.deleteParam}
					setImageInfo={rootStore.setImageInfo}
					addPinToBox={rootStore.addPinToBox}
					removePinFromBox={rootStore.removePinFromBox}
				/>
			</ModalPortal>
		</div>
	);
};

export default observer(Box, { forwardRef: true });
