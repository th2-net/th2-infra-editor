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
import useOutsideClickListener from '../../hooks/useOutsideClickListener';

interface Props {
	box: BoxEntity;
	groupsTopOffset?: number;
	titleHeight?: number;
}

export interface BoxMethods {
	updateCoords: () => void;
	kind: string;
}

const Box = ({
	box,
	groupsTopOffset,
	titleHeight,
}: Props, ref: React.Ref<BoxMethods>) => {
	const { rootStore } = useStore();
	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [isBoxActive, setIsBoxActive] = React.useState(false);
	const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);
	const [isPinConfiguratorOpen, setIsPinConfiguratorOpen] = React.useState(false);

	const boxRef = React.useRef<HTMLDivElement>(null);
	const pinsListRef = React.useRef<HTMLDivElement>(null);

	const isBoxConnectable = React.useMemo(() => Boolean(rootStore.connectionChain
		.find(connectableBox => connectableBox.name === box.name)), [rootStore.selectedPin]);

	React.useEffect(() => {
		if (rootStore.selectedBox === box) {
			setIsBoxActive(true);
		} else {
			setIsBoxActive(false);
		}
	}, [rootStore.selectedBox]);

	React.useEffect(() => {
		sendCoords();
	}, [groupsTopOffset, titleHeight, box]);

	useOutsideClickListener(boxRef, (e: MouseEvent) => {
		if (!e.composedPath().some(elem => (elem as HTMLElement).className === 'pin__dot'
		|| (elem as HTMLElement).className === 'pin__context-menu')) {
			rootStore.setSelectedBox(null);
		}
		setIsBoxActive(false);
	});

	useImperativeHandle(
		ref,
		() => ({
			updateCoords: () => {
				sendCoords();
			},
			kind: box.kind,
		}), [groupsTopOffset],
	);

	const sendCoords = () => {
		if (groupsTopOffset && titleHeight && pinsListRef.current) {
			const clientRect = pinsListRef.current?.getBoundingClientRect();

			rootStore.addCoords(box.name, box.spec.pins.map((pin, index) => {
				const leftConnection = {
					connectionOwner: {
						box: box.name,
						pin: pin.name,
						connectionType: pin['connection-type'],
					},
					left: clientRect.left,
					// Half of pin's height + height of pin's height * index
					top: clientRect.top + 12.5 + (25 * index)
						- groupsTopOffset - titleHeight,
				};
				const rightConnection = {
					connectionOwner: {
						box: box.name,
						pin: pin.name,
						connectionType: pin['connection-type'],
					},
					left: clientRect.left + clientRect.width,
					// Half of pin's height + height of pin's height * index
					top: clientRect.top + 12.5 + (25 * (index))
						- groupsTopOffset - titleHeight,
				};
				return {
					pin: pin.name,
					connections: {
						leftConnection,
						rightConnection,
					},
				};
			}));
		}
	};

	const boxClass = createBemBlock(
		'box',
		isBoxActive ? 'active' : null,
	);

	const settingsIconClassName = createBemElement(
		'box',
		'settings-icon',
		isModalOpen ? 'active' : null,
	);

	const deleteBoxHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		if (window.confirm(`Are you sure you want to delete resource "${box.name}"`)) {
			rootStore.deleteBox(box.name);
		}
	};

	const isPinConnectable = (pin: Pin) => {
		if (isBoxConnectable) {
			return pin['connection-type'] === rootStore.selectedPin?.['connection-type']
			&& !rootStore.links.some(link => link.from.box === rootStore.selectedBox?.name
				&& link.from.pin === rootStore.selectedPin?.name
				&& link.to.box === box.name
				&& link.to.pin === pin.name);
		}
		return false;
	};

	return (
		<div
			ref={boxRef}
			className={boxClass}
			onMouseOver={() => {
				if (!rootStore.selectedBox) {
					setIsBoxActive(true);
				}
			}}
			onMouseLeave={() => {
				if (!isContextMenuOpen && !isPinConfiguratorOpen) {
					setIsBoxActive(false);
				}
			}}>
			<div className="box__header">
				<span className="box__title">
					{box.name}
				</span>
				<div className="box__buttons-wrapper">
					<button
						className="box__button"
						onClick={e => {
							e.stopPropagation();
							setIsModalOpen(!isModalOpen);
						}}>
						<i className={settingsIconClassName}/>
					</button>
					<button
						className="box__button"
						onClick={deleteBoxHandler}>
						<i className='box__remove-icon'/>
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
			<div
				ref={pinsListRef}
				className="box__pins">
				{
					box.spec.pins.map(pin => (
						<BoxPin
							key={pin.name}
							pin={pin}
							box={box}
							configuratePin={rootStore.configuratePin}
							deletePinConnections={rootStore.deletePinConnections}
							selectBox={rootStore.setSelectedBox}
							selectPin={rootStore.setSelectedPin}
							isConnectable={isPinConnectable(pin)}
							setConnection={rootStore.setConnection}
							onContextMenuStateChange={setIsContextMenuOpen}
							onPinConfiguratorStateChange={setIsPinConfiguratorOpen}
							selectedBox={rootStore.selectedBox}
						/>
					))
				}
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
