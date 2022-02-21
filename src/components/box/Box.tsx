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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { BoxEntity, Pin } from '../../models/Box';
import BoxSettings from './BoxSettings';
import DictionaryModal from '../dictionary/DictionaryModal';
import PinConfigurator from '../pin-configurator/PinConfigurator';
import { ModalPortal } from '../util/Portal';
import BoxPinsContainer, { PinsContainerMethods } from './BoxPinsContainer';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import useSchemasStore from '../../hooks/useSchemasStore';
import useSubscriptionStore from '../../hooks/useSubscriptionStore';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { openConfirmModal } from '../../helpers/modal';
import { copyObject, isEqual } from '../../helpers/object';
import { DictionaryEntity } from '../../models/Dictionary';
import '../../styles/box.scss';
import '../../styles/toggler.scss';

interface Props {
	box: BoxEntity;
	color: string;
	isHidden: boolean;
	groupsTopOffset?: number;
	titleHeight?: number;
}

const Box = (
	{ box, color, isHidden, groupsTopOffset, titleHeight }: Props,
	ref: React.Ref<PinsContainerMethods>,
) => {
	const schemasStore = useSchemasStore();
	const connectionsStore = useConnectionsStore();
	const subscriptionStore = useSubscriptionStore();

	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const [editablePin, setEditablePin] = React.useState<Pin | null>(null);
	const [editableDictionary, setEditableDictionary] = React.useState<DictionaryEntity | null>(
		null,
	);
	const [isBoxActive, setIsBoxActive] = React.useState(false);

	const boxRef = React.useRef<HTMLDivElement>(null);

	const boxClass = createStyleSelector(
		'box',
		isBoxActive ? 'active' : null,
		isHidden ? 'hidden' : null,
	);

	React.useEffect(() => {
		if (editablePin && box.spec.pins && !box.spec.pins.some(pin => isEqual(pin, editablePin))) {
			const changedPin = box.spec.pins.find(pin => pin.name === editablePin.name);
			if (changedPin) {
				setEditablePin(changedPin);
			}
		}
	}, [box.spec.pins]);

	React.useEffect(() => {
		setIsBoxActive(
			schemasStore.outlinerSelectedBox
				? schemasStore.outlinerSelectedBox.name === box.name
				: false,
		);
	}, [schemasStore.outlinerSelectedBox]);

	const boxStatusClass = createBemElement(
		'box',
		'status',
		subscriptionStore.boxStates.get(box.name) ?? null,
	);

	const deleteBoxHandler = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		if (await openConfirmModal(`Are you sure you want to delete resource "${box.name}"?`)) {
			schemasStore.deleteBox(box.name, true, true);
		}
	};

	const copyBoxHandler = () => {
		const copyBox = copyObject(box);
		copyBox.name = `${copyBox.name}-copy`;
		schemasStore.createBox(copyBox);
	};

	const filterRelatedBoxes = () => {
		schemasStore.setFilterTargetBox(box);
	};

	useOutsideClickListener(boxRef, e => {
		if (
			!e
				.composedPath()
				.some(
					elem =>
						elem instanceof HTMLElement &&
						(elem.className.includes('box') || elem.className.includes('modal')),
				)
		) {
			schemasStore.setActiveBox(null);
			setIsBoxActive(false);
			if (document.onmousemove) {
				document.onmousemove = null;
				const body = document.querySelector('body');
				if (body) body.style.userSelect = 'auto';

				schemasStore.setActivePin(null);
				connectionsStore.setDraggableLink(null);
				connectionsStore.setConnectionStart(null, null);
			}
		}
	});

	const type = box.spec.type ? box.spec.type.split('-').slice(1).join('-') : box.name;
	const imageName = box.spec['image-name'];
	const splitedImageName = imageName.split('/');
	const slicedImageName = splitedImageName.slice(-(splitedImageName.length - 1)).join('/');

	const toggleDisabled = () => {
		const copyBox = copyObject(box);
		if (box.spec.disabled) {
			copyBox.spec.disabled = undefined;
		} else {
			copyBox.spec.disabled = true;
		}
		schemasStore.configurateBox(box, copyBox);
	};

	return (
		<>
			<div
				ref={boxRef}
				className={boxClass}
				onMouseOver={() => {
					if (!schemasStore.activeBox && !connectionsStore.draggableLink) {
						schemasStore.setActiveBox(box);
						setIsBoxActive(true);
					}
				}}
				onMouseLeave={() => {
					if (!editablePin && isBoxActive && !schemasStore.activePin) {
						schemasStore.setActiveBox(null);
						setIsBoxActive(false);
					}
				}}>
				<div
					style={{
						backgroundColor: color,
					}}
					className='box__header'>
					{subscriptionStore.isSubscriptionSuccessfull && (
						<div className={boxStatusClass} />
					)}
					<span className='box__title'>{box.name}</span>
					<div className='box__buttons-wrapper'>
						<div className='toggler'>
							<div
								className={`toggler__bar ${box.spec.disabled ? 'off' : 'on'}`}
								onClick={toggleDisabled}
							/>
						</div>
						<button className='box__button filter' onClick={filterRelatedBoxes}>
							<i className='box__button-icon' />
						</button>
						<button className='box__button copy' onClick={copyBoxHandler}>
							<i className='box__button-icon' />
						</button>
						<button className='box__button remove' onClick={deleteBoxHandler}>
							<i className='box__button-icon' />
						</button>
						<button
							className='box__button settings'
							onClick={e => {
								e.stopPropagation();
								setIsModalOpen(!isModalOpen);
							}}>
							<i className='box__button-icon' />
						</button>
					</div>
				</div>
				<div className='box__body'>
					<div className='box__info-list'>
						<div className='box__info'>
							<div
								className='box__info-value type'
								style={{ backgroundColor: color }}>
								{type}
							</div>
							<div className={`box__info-value image-name`} title={imageName}>
								{slicedImageName}
							</div>
						</div>
					</div>
					{box.spec.pins && box.spec.pins.length > 0 && (
						<BoxPinsContainer
							ref={ref}
							pins={box.spec.pins}
							isBoxActive={isBoxActive}
							boxName={box.name}
							setEditablePin={setEditablePin}
							groupsTopOffset={groupsTopOffset}
							titleHeight={titleHeight}
						/>
					)}
				</div>
			</div>
			<ModalPortal isOpen={isModalOpen} closeModal={() => setIsModalOpen(false)}>
				<BoxSettings
					box={box}
					onClose={() => setIsModalOpen(false)}
					setEditablePin={pin => {
						setEditablePin(pin);
						setIsModalOpen(false);
					}}
					setEditableDictionary={dictionary => {
						setEditableDictionary(dictionary);
						setIsModalOpen(false);
					}}
				/>
			</ModalPortal>
			{editablePin && (
				<ModalPortal isOpen={Boolean(editablePin)} closeModal={() => setEditablePin(null)}>
					<PinConfigurator
						pin={editablePin}
						configuratePin={schemasStore.configuratePin}
						boxName={box.name}
						connectionTypes={schemasStore.connectionTypes}
						onClose={() => {
							setEditablePin(null);
						}}
					/>
				</ModalPortal>
			)}
			{editableDictionary && (
				<ModalPortal isOpen={Boolean(editableDictionary)}>
					<DictionaryModal
						dictionary={editableDictionary}
						onClose={() => setEditableDictionary(null)}
					/>
				</ModalPortal>
			)}
		</>
	);
};

export default observer(Box, { forwardRef: true });
