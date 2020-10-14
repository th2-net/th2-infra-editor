import { observer } from 'mobx-react-lite';
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
import { createBemElement } from '../../helpers/styleCreators';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import useSchemasStore from '../../hooks/useSchemasStore';
import { BoxEntity, Pin } from '../../models/Box';
import '../../styles/modal.scss';
import '../../styles/elements.scss';
import BoxSettings from '../box/BoxSettings';
import { ModalPortal } from '../util/Portal';
import ElementsListBoxItem from './ElementsListBoxItem';
import ElementsListDictionaryItem from './ElementsListDictionaryItem';
import ElementsListLinkItem from './ElementsListLinkItem';
import PinConfigurator from '../pin-configurator/PinConfigurator';
import DictionaryModal from '../dictionary/DictionaryModal';
import { DictionaryEntity } from '../../models/Dictionary';

interface ElementsListModalProps {
	top?: number;
	left?: number;
	width?: number;
	onClose: () => void;
}

const ElementsListModal = ({
	top,
	left,
	width,
	onClose,
}: ElementsListModalProps) => {
	const schemasStore = useSchemasStore();
	const connectionsStore = useConnectionsStore();

	const modalRef = React.useRef<HTMLDivElement>(null);

	const [currentSection, setCurrentSection] = React.useState<'boxes' | 'links' | 'dictionaries'>('boxes');
	const [sortDirection, setSortDicrection] = React.useState<'asc' | 'desc'>('desc');

	const [editableBox, setEditableBox] = React.useState<BoxEntity | null>(null);
	const [editablePin, setEditablePin] = React.useState<Pin | null>(null);
	const [editableDictionary, setEditableDictionary] = React.useState<DictionaryEntity | null>(null);
	const [boxName, setBoxName] = React.useState<string | null>(null);

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

	const sortButtonClass = createBemElement(
		'modal',
		'button',
		'sort',
		sortDirection,
	);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (!e.composedPath().some(
			elem =>
				((elem as HTMLElement).className
					&& (elem as HTMLElement).className.includes)
					&& ((elem as HTMLElement).className.includes('header__button elements active')
						|| ((elem as HTMLElement).className.includes('modal'))),
		)) {
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
				className="modal header__modal">
				<div className="modal__content">
					<div className="modal__content-switcher">
						<div
							onClick={() => setCurrentSection('boxes')}
							className={boxButtonClass}>
							<i className="modal__content-switcher-button-icon" />
							{
								`${schemasStore.boxes.length} ${schemasStore.boxes.length === 1
									? 'box'
									: 'boxes'}`
							}
						</div>
						<div
							onClick={() => setCurrentSection('links')}
							className={linkButtonClass}>
							<i className="modal__content-switcher-button-icon" />
							{
								`${connectionsStore.connections.length} ${connectionsStore.connections.length === 1
									? 'link'
									: 'links'}`
							}
						</div>
						<div
							onClick={() => setCurrentSection('dictionaries')}
							className={dictionaryButtonClass}>
							<i className="modal__content-switcher-button-icon" />
							{
								`${schemasStore.dictionaryList.length} ${schemasStore.dictionaryList.length === 1
									? 'dictionary'
									: 'dictonaries'}`
							}
						</div>
					</div>
					<button
						onClick={() => setSortDicrection(sortDirection === 'asc' ? 'desc' : 'asc')}
						className={sortButtonClass}>
						<i className="modal__button-icon" />
						Sort by {currentSection === 'boxes' ? 'Kind' : 'Name'}
					</button>
				</div>
				<div className="modal__elements-list">
					{
						currentSection === 'boxes'
						&& (schemasStore.boxes.length > 0
							? schemasStore.boxes
								.sort((a, b) =>
									(a.kind > b.kind
										? sortDirection === 'asc'
											? -1 : 1
										: a.kind < b.kind
											? sortDirection === 'asc'
												? 1 : -1
											: 0
									))
								.map(box => (
									<ElementsListBoxItem
										key={box.name}
										box={box}
										editBox={() => setEditableBox(box)}
										deleteBox={deletableBox => schemasStore.deleteBox(deletableBox)}
										activeBox={schemasStore.activeBox}
										setActiveBox={schemasStore.setActiveBox}
										color={schemasStore.getBoxBorderColor(box.name)} />
								))
							: <div className="modal__empty">
								Box list is empty
							</div>)
					}
					{
						currentSection === 'links'
						&& (connectionsStore.links.length > 0
							? connectionsStore.links
								.sort((a, b) =>
									(a.name > b.name
										? sortDirection === 'asc'
											? -1 : 1
										: a.name < b.name
											? sortDirection === 'asc'
												? 1 : -1
											: 0
									))
								.map(connection => (
									<ElementsListLinkItem
										key={connection.name}
										link={connection}
										deleteConnection={connectionsStore.deleteConnection}
										getBoxBorderColor={schemasStore.getBoxBorderColor} />
								))
							: <div className="modal__empty">
								Links list is empty
							</div>)
					}
					{
						currentSection === 'dictionaries'
						&& (schemasStore.dictionaryList.length > 0
							? schemasStore.dictionaryList
								.sort((a, b) =>
									(a.name > b.name
										? sortDirection === 'asc'
											? -1 : 1
										: a.name < b.name
											? sortDirection === 'asc'
												? 1 : -1
											: 0
									))
								.map(dictionary => (
									<ElementsListDictionaryItem
										key={dictionary.name}
										dictionary={dictionary}
										deleteDictionary={schemasStore.deleteDictionary}
										setEditableDictionary={setEditableDictionary} />
								))
							: <div className="modal__empty">
								Dictionary list is empty
							</div>)
					}
				</div>
			</div>
			{
				editableBox
				&& <ModalPortal isOpen={Boolean(editableBox)}>
					<BoxSettings
						box={editableBox}
						configurateBox={schemasStore.configurateBox}
						dictionaryNamesList={schemasStore.dictionaryList.map(dictionary => dictionary.name)}
						onClose={() => setEditableBox(null)}
						relatedDictionary={
							schemasStore.dictionaryLinksEntity
								? schemasStore
									.dictionaryLinksEntity
									.spec['dictionaries-relation'].filter(link => link.box === editableBox.name)
								: []
						}
						setEditablePin={pin => {
							setEditablePin(pin);
							setBoxName(editableBox.name);
							setEditableBox(null);
						}} />
				</ModalPortal>
			}
			{
				(editablePin && boxName)
				&& <ModalPortal isOpen={Boolean(editablePin)}>
					<PinConfigurator
						pin={editablePin}
						boxName={boxName}
						configuratePin={schemasStore.configuratePin}
						connectionTypes={schemasStore.connectionTypes}
						onClose={() => setEditablePin(null)} />
				</ModalPortal>
			}
			{
				editableDictionary
				&& <ModalPortal isOpen={Boolean(editableDictionary)}>
					<DictionaryModal
						dictionary={editableDictionary}
						onClose={() => setEditableDictionary(null)} />
				</ModalPortal>
			}
		</>
	);
};

export default observer(ElementsListModal);
