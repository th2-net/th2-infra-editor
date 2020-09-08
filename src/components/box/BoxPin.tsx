/** *****************************************************************************
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

import React from 'react';
import { ModalPortal } from '../util/Portal';
import PinEditor from './PinEditor';
import { Pin, BoxEntity } from '../../models/Box';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import ContextMenu from './ContextMenu';
import { createBemBlock } from '../../helpers/styleCreators';

interface BoxPinProps {
	configuratePin: (pin: Pin, boxName: string) => void;
	pin: Pin;
	box: BoxEntity;
	deletePinConnections: (pin: Pin, boxName: string) => void;
	selectBox: (box: BoxEntity | null) => void;
	selectPin: (pin: Pin | null) => void;
	isConnectable: boolean;
	setConnection: (connectionName: string, pin: Pin, box: BoxEntity) => void;
	onContextMenuStateChange: (isOpen: boolean) => void;
	onPinEditorStateChange: (isOpen: boolean) => void;
	selectedBox: BoxEntity | null;
}

const BoxPin = ({
	configuratePin,
	pin,
	box,
	deletePinConnections,
	selectBox,
	selectPin,
	isConnectable,
	setConnection,
	onContextMenuStateChange,
	onPinEditorStateChange,
	selectedBox,
}: BoxPinProps) => {
	const [isPinEditorOpen, setIsPinEditorOpen] = React.useState(false);
	const [isContextMenuOpen, setIsContextMenuOpen] = React.useState(false);

	const pinRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(pinRef, (e: MouseEvent) => {
		if (!e.composedPath().some(elem => (elem as HTMLElement).className === 'pin__dot'
		|| (elem as HTMLElement).className === 'pin__context-menu')) {
			onContextMenuStateChange(false);
			setIsContextMenuOpen(false);
			selectBox(null);
			selectPin(null);
		}
	});

	React.useEffect(() => {
		if (!selectedBox) {
			setIsContextMenuOpen(false);
			onContextMenuStateChange(false);
		}
	}, [selectedBox]);

	const pinClass = createBemBlock(
		'pin',
		isContextMenuOpen || isConnectable ? 'active' : null,
	);

	const clickHandler = () => {
		if (!isConnectable) {
			setIsContextMenuOpen(!isContextMenuOpen);
			onContextMenuStateChange(!isContextMenuOpen);
			selectBox(box);
			selectPin(pin);
		} else {
			// eslint-disable-next-line no-alert
			const connectionName = prompt('Connection name');
			if (connectionName) {
				setConnection(connectionName, pin, box);
			}
			selectBox(null);
			selectPin(null);
		}
	};

	return (
		<>
			<div
				className={pinClass}>
				<div
					ref={pinRef}
					onClick={clickHandler}
					className="pin__dot"/>
				<span className="pin__name">{pin.name}</span>
				<span className="pin__type">{pin['connection-type']}</span>
				{
					isContextMenuOpen
					&& <ContextMenu
						togglePinEditor={() => {
							setIsPinEditorOpen(!isPinEditorOpen);
							onPinEditorStateChange(false);
						}}
						closeContextMenu={() => {
							setIsContextMenuOpen(false);
							onContextMenuStateChange(false);
						}}
						deletePinConnections={() => deletePinConnections(pin, box.name)}
					/>
				}
			</div>
			<ModalPortal isOpen={isPinEditorOpen}>
				<PinEditor
					pin={pin}
					configuratePin={configuratePin}
					boxName={box.name}
					onClose={() => {
						setIsPinEditorOpen(false);
						onPinEditorStateChange(false);
					}}
				/>
			</ModalPortal>
		</>
	);
};

export default BoxPin;
