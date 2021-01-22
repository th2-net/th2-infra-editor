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

import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { createBemElement } from '../../helpers/styleCreators';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import useSchemasStore from '../../hooks/useSchemasStore';
import { BoxEntity, ExtendedConnectionOwner, Pin } from '../../models/Box';
import BoxSettings from '../box/BoxSettings';
import { ModalPortal } from '../util/Portal';
import ElementsListBoxItem from './ElementsListBoxItem';
import ElementsListDictionaryItem from './ElementsListDictionaryItem';
import ElementsListLinkItem from './ElementsListLinkItem';
import PinConfigurator from '../pin-configurator/PinConfigurator';
import DictionaryModal from '../dictionary/DictionaryModal';
import { DictionaryEntity } from '../../models/Dictionary';
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';
import { Link } from '../../models/LinksDefinition';
import { isFilterPassed } from '../../helpers/filter';
import { sortBy } from '../../helpers/array';
import '../../styles/modal.scss';
import '../../styles/elements.scss';

interface ElementsListModalProps {
	top?: number;
	left?: number;
	width?: number;
	onClose: () => void;
}

interface ElementsListModalItem {
	item: BoxEntity | Link<ExtendedConnectionOwner> | DictionaryEntity;
	isFilterPassed: boolean;
}

const ElementsListModal = ({ top, left, width, onClose }: ElementsListModalProps) => {
	const schemasStore = useSchemasStore();
	const connectionsStore = useConnectionsStore();

	const modalRef = React.useRef<HTMLDivElement>(null);

	const [currentSection, setCurrentSection] = React.useState<'boxes' | 'links' | 'dictionaries'>(
		'boxes',
	);
	const [sortDirection, setSortDicrection] = React.useState<'asc' | 'desc'>('desc');

	const [editableBox, setEditableBox] = React.useState<BoxEntity | null>(null);
	const [editablePin, setEditablePin] = React.useState<Pin | null>(null);
	const [editableDictionary, setEditableDictionary] = React.useState<DictionaryEntity | null>(
		null,
	);
	const [boxName, setBoxName] = React.useState<string | null>(null);

	React.useEffect(() => {
		const changedDictionary = schemasStore.dictionaryList.find(
			dictionary => dictionary.name === editableDictionary?.name,
		);
		if (changedDictionary) {
			setEditableDictionary(changedDictionary);
		}
	}, [schemasStore.dictionaryList]);

	React.useEffect(() => {
		filterInput.reset();
	}, [currentSection]);

	const filterInput = useInput({ id: 'outliner-filter' });

	const boxButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		'boxes',
		currentSection === 'boxes' ? 'active' : 'null',
	);

	const linkButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		'links',
		currentSection === 'links' ? 'active' : 'null',
	);

	const dictionaryButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		'dictionaries',
		currentSection === 'dictionaries' ? 'active' : 'null',
	);

	const sortButtonClass = createBemElement('modal', 'button', 'sort', sortDirection);

	const elements = useMemo(() => {
		let tempElements: ElementsListModalItem[];
		switch (currentSection) {
			case 'boxes': {
				tempElements = sortBy(schemasStore.boxes, box => box.spec.type, sortDirection).map(
					box => {
						return {
							item: box,
							isFilterPassed: isFilterPassed(box, filterInput.value),
						};
					},
				);
				break;
			}
			case 'links': {
				tempElements = sortBy(connectionsStore.links, link => link.name, sortDirection).map(
					link => {
						return {
							item: link,
							isFilterPassed: isFilterPassed(link, filterInput.value),
						};
					},
				);
				break;
			}
			case 'dictionaries': {
				tempElements = sortBy(
					schemasStore.dictionaryList,
					dictLink => dictLink.name,
					sortDirection,
				).map(dictionary => {
					return {
						item: dictionary,
						isFilterPassed: isFilterPassed(dictionary, filterInput.value),
					};
				});
				break;
			}
			default:
				tempElements = [];
		}

		return tempElements.sort((a, b) =>
			a.isFilterPassed === b.isFilterPassed ? 0 : a.isFilterPassed ? -1 : 1,
		);
	}, [currentSection, filterInput]);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (
			!e
				.composedPath()
				.some(
					elem =>
						elem instanceof HTMLElement &&
						(elem.className.includes('header__button elements active') ||
							elem.className.includes('modal')),
				)
		) {
			onClose();
		}
	});

	return (
		<>
			<div
				ref={modalRef}
				style={{
					left: `${left ?? 0}px`,
					top: `${top ?? 0}px`,
					width: `${width ?? 0}px`,
				}}
				className='modal header__modal'>
				<div className='modal__content'>
					<div className='modal__content-switcher'>
						<div onClick={() => setCurrentSection('boxes')} className={boxButtonClass}>
							<i className='modal__content-switcher-button-icon' />
							{`${schemasStore.boxes.length} ${
								schemasStore.boxes.length === 1 ? 'box' : 'boxes'
							}`}
						</div>
						<div onClick={() => setCurrentSection('links')} className={linkButtonClass}>
							<i className='modal__content-switcher-button-icon' />
							{`${connectionsStore.links.length} ${
								connectionsStore.links.length === 1 ? 'link' : 'links'
							}`}
						</div>
						<div
							onClick={() => setCurrentSection('dictionaries')}
							className={dictionaryButtonClass}>
							<i className='modal__content-switcher-button-icon' />
							{`${schemasStore.dictionaryList.length} ${
								schemasStore.dictionaryList.length === 1
									? 'dictionary'
									: 'dictonaries'
							}`}
						</div>
					</div>
					<button
						onClick={() => setSortDicrection(sortDirection === 'asc' ? 'desc' : 'asc')}
						className={sortButtonClass}>
						<i className='modal__button-icon' />
						Sort by {currentSection === 'boxes' ? 'Type' : 'Name'}
					</button>
				</div>
				<div className='modal__elements-list'>
					{currentSection === 'boxes' &&
						(schemasStore.boxes.length > 0 ? (
							elements.map(box => (
								<ElementsListBoxItem
									key={`box-${box.item.name}`}
									box={box.item as BoxEntity}
									editBox={() => setEditableBox(box.item as BoxEntity)}
									deleteBox={deletableBox =>
										schemasStore.deleteBox(deletableBox, true)
									}
									activeBox={schemasStore.activeBox}
									setActiveBox={schemasStore.setActiveBox}
									color={schemasStore.getBoxBorderColor(box.item.name)}
									isFilterPassed={box.isFilterPassed}
								/>
							))
						) : (
							<div className='modal__empty'>Box list is empty</div>
						))}
					{currentSection === 'links' &&
						(connectionsStore.links.length > 0 ? (
							elements.map(link => (
								<ElementsListLinkItem
									key={`${(link.item as Link<ExtendedConnectionOwner>).name}-${
										(link.item as Link<ExtendedConnectionOwner>).from.box
									}-${(link.item as Link<ExtendedConnectionOwner>).to.box}`}
									link={link.item as Link<ExtendedConnectionOwner>}
									deleteConnection={connectionsStore.deleteLink}
									getBoxBorderColor={schemasStore.getBoxBorderColor}
									isFilterPassed={link.isFilterPassed}
								/>
							))
						) : (
							<div className='modal__empty'>Links list is empty</div>
						))}
					{currentSection === 'dictionaries' &&
						(schemasStore.dictionaryList.length > 0 ? (
							elements.map(dictionary => (
								<ElementsListDictionaryItem
									key={`dict-${dictionary.item.name}`}
									dictionary={dictionary.item as DictionaryEntity}
									deleteDictionary={schemasStore.deleteDictionary}
									setEditableDictionary={setEditableDictionary}
									isFilterPassed={dictionary.isFilterPassed}
								/>
							))
						) : (
							<div className='modal__empty'>Dictionary list is empty</div>
						))}
				</div>
				<div className='modal__content'>
					<Input inputConfig={filterInput} />
				</div>
			</div>
			{editableBox && (
				<ModalPortal isOpen={Boolean(editableBox)}>
					<BoxSettings
						box={editableBox}
						onClose={() => setEditableBox(null)}
						setEditablePin={pin => {
							setEditablePin(pin);
							setBoxName(editableBox.name);
							setEditableBox(null);
						}}
						setEditableDictionary={dictionary => {
							setEditableDictionary(dictionary);
							setBoxName(editableBox.name);
							setEditableBox(null);
						}}
					/>
				</ModalPortal>
			)}
			{editablePin && boxName && (
				<ModalPortal isOpen={Boolean(editablePin)}>
					<PinConfigurator
						pin={editablePin}
						boxName={boxName}
						configuratePin={schemasStore.configuratePin}
						connectionTypes={schemasStore.connectionTypes}
						onClose={() => setEditablePin(null)}
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

export default observer(ElementsListModal);
