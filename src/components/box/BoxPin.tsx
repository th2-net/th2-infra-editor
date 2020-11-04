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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { openConfirmModal, openDecisionModal, openPromptModal } from '../../helpers/modal';
import { createBemElement } from '../../helpers/styleCreators';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import useSchemasStore from '../../hooks/useSchemasStore';
import { Pin } from '../../models/Box';
import { Link } from '../../models/LinksDefinition';
import { ModalPortal } from '../util/Portal';

export const PIN_DOT_HEIGHT = 12;
const STANDART_PIN_HEIGHT = 24;
const PIN_OFFSET = 6;
const NAME_MODAL_OFFSET = 7;

interface BoxPinProps {
	pin: Pin;
	setEditablePin: (pin: Pin) => void;
	getPinLinks: (
		pin: Pin,
		direction: 'left' | 'right' | 'both',
	) => {
		in: Link[];
		out: Link[];
	};
	isPinExpanded: boolean;
	togglePin: (isOpen: boolean) => void;
	isConnectable: boolean;
	boxName: string;
	groupsTopOffset?: number;
	titleHeight?: number;
}

const BoxPin = (
	{
		pin,
		setEditablePin,
		getPinLinks,
		isPinExpanded,
		togglePin,
		isConnectable,
		boxName,
		groupsTopOffset,
		titleHeight,
	}: BoxPinProps,
	ref: React.Ref<HTMLDivElement>,
) => {
	const schemasStore = useSchemasStore();
	const connectionsStore = useConnectionsStore();

	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const [openedConnection, setOpenedConnection] = React.useState<string | null>(null);
	const [nameModal, setNameModal] = React.useState<{
		name: string;
		side: 'left' | 'right';
		coords: {
			left: number;
			top: number;
		};
	} | null>(null);

	const connectionsRefs: (HTMLDivElement | null)[] = [];

	React.useEffect(() => {
		if (!isPinExpanded) {
			setIsMenuOpen(false);
		}
	}, [isPinExpanded]);

	const pinClass = createBemElement(
		'box',
		'pin',
		'active',
		isPinExpanded ? 'open' : null,
		isConnectable ? 'connectable' : null,
	);

	const infoClass = createBemElement('box', 'pin-info', isMenuOpen ? 'active' : null);

	const leftPinLinks = getPinLinks(pin, 'left');
	const rightPinLinks = getPinLinks(pin, 'right');

	const leftPinLinksAmount = leftPinLinks.in.length + leftPinLinks.out.length;

	const rightPinLinksAmount = rightPinLinks.in.length + rightPinLinks.out.length;

	const pinHeight = React.useMemo(() => {
		if (!leftPinLinks || !rightPinLinks) return STANDART_PIN_HEIGHT;
		return Math.max(
			(leftPinLinks.in.length + leftPinLinks.out.length) * (PIN_OFFSET + PIN_DOT_HEIGHT) +
				PIN_OFFSET,
			(rightPinLinks.in.length + rightPinLinks.out.length) * (PIN_OFFSET + PIN_DOT_HEIGHT) +
				PIN_OFFSET,
			STANDART_PIN_HEIGHT,
		);
	}, [leftPinLinks, rightPinLinks]);

	const expandPin = () => {
		togglePin(!isPinExpanded);
		if (isPinExpanded) setIsMenuOpen(false);
	};

	const pinClickHandler = async () => {
		if (connectionsStore.draggableLink) return;

		if (!isConnectable) {
			expandPin();
			schemasStore.setActivePin(!isPinExpanded ? pin : null);
		} else {
			if (!schemasStore.activeBox) return;
			const defaultName = connectionsStore.generateLinkName(
				schemasStore.activeBox.name,
				boxName,
			);

			const linkName = await openPromptModal('Connection name', defaultName);
			if (!linkName) return;
			connectionsStore.createLink(linkName, pin.name, pin['connection-type'], boxName);
		}
	};

	const dragLink = (link: Link, targetPin: Pin) => {
		const body = document.querySelector('body');
		if (body) body.style.userSelect = 'none';

		const connectableBox = schemasStore.boxes.find(box => box.name === link.from.box);

		if (!connectableBox || !connectableBox.spec.pins) return;

		const connectablePin = connectableBox.spec.pins.find(
			boxPin => boxPin.name === link.from.pin,
		);

		if (!connectablePin) return;

		connectionsStore.setConnectionStart(connectableBox, connectablePin);

		document.onmousemove = (e: MouseEvent) => {
			connectionsStore.setDraggableLink(link);
			connectionsStore.addConnection([
				{
					name: link.name,
					connectionOwner: {
						box: boxName,
						pin: targetPin.name,
						connectionType: targetPin['connection-type'],
					},
					coords: {
						leftPoint: {
							left: e.pageX,
							top: e.pageY - (groupsTopOffset ?? 0) - (titleHeight ?? 0),
						},
						rightPoint: {
							left: e.pageX,
							top: e.pageY - (groupsTopOffset ?? 0) - (titleHeight ?? 0),
						},
					},
				},
			]);
		};
	};

	const dropLink = async () => {
		if (!connectionsStore.draggableLink) return;

		document.onmousemove = null;
		const body = document.querySelector('body');
		if (body) body.style.userSelect = 'auto';

		connectionsStore.setConnectionStart(schemasStore.activeBox, schemasStore.activePin);

		const draggableLink = connectionsStore.draggableLink;

		if (draggableLink) {
			const changedSide: 'from' | 'to' =
				schemasStore.activeBox?.name === draggableLink.from.box &&
				schemasStore.activePin?.name === draggableLink.from.pin
					? 'from'
					: 'to';

			const newName = await connectionsStore.generateLinkName(
				changedSide === 'from' ? boxName : draggableLink.from.box,
				changedSide === 'to' ? boxName : draggableLink.to.box,
			);

			const changeLink = (linkName: string, oldLink?: Link): Link => {
				const link = {
					name: linkName,
					from: {
						box: changedSide === 'from' ? boxName : draggableLink.from.box,
						pin: changedSide === 'from' ? pin.name : draggableLink.from.pin,
						connectionType: draggableLink.from.connectionType,
					},
					to: {
						box: changedSide === 'to' ? boxName : draggableLink.to.box,
						pin: changedSide === 'to' ? pin.name : draggableLink.to.pin,
						connectionType: draggableLink.from.connectionType,
					},
				};
				connectionsStore.changeLink(link, oldLink);
				return link;
			};

			const newLink = changeLink(newName);

			openDecisionModal(`Link has been renamed to ${newName}`, {
				variants: [
					{
						title: 'Rename',
						func: async () => {
							const name = await openPromptModal('Link name', newName);
							if (!name) return;

							changeLink(name, newLink);
						},
					},
				],
			});
		}
	};

	const deleteAllRelatedLinks = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (isMenuOpen) {
			e.stopPropagation();
			if (
				await openConfirmModal(
					`Are you sure you want to delete all "${pin.name}" pin links`,
				)
			) {
				schemasStore.deletePinConnections(pin, boxName);
			}
		}
	};

	const deleteLink = async (link: Link) => {
		if (await openConfirmModal(`Are you sure you want to delete link "${link.name}"`)) {
			connectionsStore.deleteLink(link);
		}
	};

	const onMouseOverHandler = (link: Link, linkSide: 'left' | 'right', index: number) => {
		const connClientRect = connectionsRefs[index]?.getBoundingClientRect();
		setNameModal({
			name: link.name,
			side: linkSide,
			coords: {
				left: connClientRect
					? linkSide === 'left'
						? connClientRect.left - NAME_MODAL_OFFSET
						: connClientRect.right + NAME_MODAL_OFFSET
					: 0,
				top: connClientRect ? connClientRect.top + connClientRect.height / 2 : 0,
			},
		});
	};

	return (
		<div
			ref={ref}
			onClick={pinClickHandler}
			style={{
				height: isPinExpanded ? pinHeight : STANDART_PIN_HEIGHT,
			}}
			onMouseUp={dropLink}
			className={pinClass}>
			{isPinExpanded ? (
				leftPinLinks &&
				[
					...leftPinLinks.in,
					...leftPinLinks.out,
					...rightPinLinks.in,
					...rightPinLinks.out,
				].map((link, index) => {
					const linkSide = index < leftPinLinksAmount ? 'left' : 'right';

					return (
						<div
							key={link.name}
							ref={connectionRef => (connectionsRefs[index] = connectionRef)}
							onClick={e => {
								e.stopPropagation();
								setOpenedConnection(link.name);
							}}
							onMouseOver={() => onMouseOverHandler(link, linkSide, index)}
							onMouseLeave={() => setNameModal(null)}
							style={{
								top:
									(pinHeight /
										((linkSide === 'left'
											? leftPinLinksAmount
											: rightPinLinksAmount) +
											1)) *
									(index + 1),
							}}
							onMouseDown={e => {
								e.stopPropagation();
								dragLink(link, pin);
							}}
							className={`box__pin-dot ${
								openedConnection === link.name ? 'open' : null
							} ${linkSide}`}>
							<button
								onClick={() => deleteLink(link)}
								className='box__pin-dot-delete-btn'
							/>
						</div>
					);
				})
			) : (
				<>
					<div className='box__pin-dot left' />
					<div className='box__pin-dot right' />
				</>
			)}
			{!isPinExpanded && <span className='box__pin-counter left'>{leftPinLinksAmount}</span>}
			{isMenuOpen && (
				<button onClick={deleteAllRelatedLinks} className='box__pin-button remove'>
					<i className='box__pin-button-icon' />
				</button>
			)}
			<div
				onClick={e => {
					if (isPinExpanded) {
						e.stopPropagation();
						setIsMenuOpen(!isMenuOpen);
					}
				}}
				className={infoClass}>
				<span className='box__pin-name'>{`${pin.name} / ${pin['connection-type']}`}</span>
			</div>
			{isMenuOpen && (
				<button
					onClick={e => {
						if (isMenuOpen) {
							e.stopPropagation();
							setEditablePin(pin);
						}
					}}
					className='box__pin-button settings'>
					<i className='box__pin-button-icon' />
				</button>
			)}
			{!isPinExpanded && (
				<span className='box__pin-counter right'>{rightPinLinksAmount}</span>
			)}
			{nameModal && (
				<ModalPortal isOpen={Boolean(nameModal)}>
					<div
						style={{
							top: nameModal.coords.top,
							left: nameModal.coords.left,
							transform: `translate(${
								nameModal.side === 'left' ? '-100' : '0'
							}%, -50%)`,
						}}
						className='box__pin-connection-name'>
						{nameModal.name}
					</div>
				</ModalPortal>
			)}
		</div>
	);
};

export default observer(BoxPin, { forwardRef: true });
