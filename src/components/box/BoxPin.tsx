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
import { Pin, BoxEntity } from '../../models/Box';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import ContextMenu from './ContextMenu';
import { createBemElement } from '../../helpers/styleCreators';

interface BoxPinProps {
	pin: Pin;
	box: BoxEntity;
	deletePinConnections: (pin: Pin, boxName: string) => void;
	selectBox: (box: BoxEntity | null) => void;
	selectPin: (pin: Pin | null) => void;
	connectionDirection: 'left' | 'right' | 'both' | 'none';
	setConnection: (
		connectionName: string,
		pinName: string, connectionType: 'mq' | 'grpc',
		boxName: string,
	) => void;
	onContextMenuStateChange: (isOpen: boolean) => void;
	setEditablePin: (pin: Pin) => void;
	leftDotVisible: boolean;
	rightDotVisible: boolean;
	activeBox: BoxEntity | null;
	activePin: Pin | null;
}

const BoxPin = React.forwardRef(({
	pin,
	box,
	deletePinConnections,
	selectBox,
	selectPin,
	connectionDirection,
	setConnection,
	onContextMenuStateChange,
	setEditablePin,
	leftDotVisible,
	rightDotVisible,
	activeBox,
	activePin,
}: BoxPinProps, ref: React.Ref<HTMLDivElement>) => {
	const [contextMenuState, setContextMenuState] = React.useState<'left' | 'right' | 'closed'>('closed');

	const pinRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(pinRef, (e: MouseEvent) => {
		if (
			!e.composedPath()
				.some(
					elem =>
						((elem as HTMLElement).className
							&& (elem as HTMLElement).className.includes)
							&& ((elem as HTMLElement).className.includes('pin__dot')
						|| (elem as HTMLElement).className.includes('pin__context-menu')),
				)
		) {
			onContextMenuStateChange(false);
			setContextMenuState('closed');
			selectBox(null);
			selectPin(null);
		}
	});

	React.useEffect(() => {
		if (activePin?.name !== pin.name) {
			setContextMenuState('closed');
		}
	}, [activePin]);

	const leftDotClass = createBemElement(
		'pin',
		'dot',
		contextMenuState === 'left' || connectionDirection === 'left'
			? 'active' : null,
		contextMenuState !== 'left'
			&& !leftDotVisible
			&& connectionDirection !== 'left'
			&& connectionDirection !== 'both'
			? 'hidden' : null,
	);

	const rightDotClass = createBemElement(
		'pin',
		'dot',
		contextMenuState === 'right' || connectionDirection === 'right'
			? 'active' : null,
		contextMenuState !== 'right'
			&& !rightDotVisible
			&& connectionDirection !== 'right'
			&& connectionDirection !== 'both'
			? 'hidden' : null,
	);

	const clickHandler = (direction: 'left' | 'right') => {
		if (activePin && box.name !== activeBox?.name) {
			// eslint-disable-next-line no-alert
			const connectionName = prompt('Connection name');
			if (connectionName) {
				setConnection(
					connectionName,
					pin.name, pin['connection-type'] as 'mq' | 'grpc',
					box.name,
				);
			}
			selectBox(null);
			selectPin(null);
		} else {
			setContextMenuState(direction);
			onContextMenuStateChange(true);
			selectBox(box);
			selectPin(pin);
		}
	};

	return (
		<div
			ref={ref}
			className='pin'>
			<div
				ref={pinRef}
				onClick={() => clickHandler('left')}
				className={leftDotClass}/>
			<div className="pin__info">
				<div className="pin__info-value">{pin.name}</div>
				<div className="pin__info-value">{pin['connection-type']}</div>
			</div>
			<div
				ref={pinRef}
				onClick={() => clickHandler('right')}
				className={rightDotClass}/>
			<ContextMenu
				state={contextMenuState}
				togglePinConfigurator={() => {
					setEditablePin(pin);
				}}
				closeContextMenu={() => {
					setContextMenuState('closed');
					onContextMenuStateChange(false);
				}}
				deletePinConnections={() => deletePinConnections(pin, box.name)}
			/>
		</div>
	);
});

BoxPin.displayName = 'BoxPin';

export default BoxPin;
