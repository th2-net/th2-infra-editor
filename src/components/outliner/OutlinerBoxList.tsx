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
import BoxSettings from '../box/BoxSettings';
import { BoxEntity, Pin } from '../../models/Box';
import { createBemElement } from '../../helpers/styleCreators';
import { DictionaryRelation } from '../../models/Dictionary';
import PinConfigurator from '../pin-configurator/PinConfigurator';

interface OutlinerBoxListItemProps {
	box: BoxEntity;
	activeBox: BoxEntity | null;
	setActiveBox: (box: BoxEntity | null) => void;
	setEditableBox: (box: BoxEntity) => void;
	setIsBoxCreateModalOpen: (isOpen: boolean) => void;
	deleteBox: (boxName: string) => void;
}

const OutlinerBoxListItem = ({
	box,
	setActiveBox,
	setEditableBox,
	setIsBoxCreateModalOpen,
	deleteBox,
	activeBox,
}: OutlinerBoxListItemProps) => {
	const itemClass = createBemElement(
		'outliner',
		'list-item',
		(activeBox && box.name === activeBox.name) ? 'highlighted' : null,
	);

	return (
		<div
			key={`${box.name}-${box.kind}`}
			onMouseOver={() => setActiveBox(box)}
			onMouseLeave={() => setActiveBox(null)}
			className={itemClass}
		>
			<div className="outliner__item-info">
				<span className="outliner__info-key">Kind:</span>
				<span className="outliner__info-value">{box.kind}</span>
			</div>
			<div className="outliner__item-info">
				<span className="outliner__info-key">Name:</span>
				<span className="outliner__info-value">{box.name}</span>
			</div>
			<div className="outliner__item-control-buttons">
				<button
					onClick={() => {
						setEditableBox(box);
						setIsBoxCreateModalOpen(true);
					}}
					className="outliner__item-button"
				>
					<i className="outliner__item-button-icon edit"></i>
				</button>
				<button
					onClick={() => {
						// eslint-disable-next-line no-alert
						if (window.confirm(`Are you sure you want to delete resourse "${box.name}"`)) {
							deleteBox(box.name);
						}
					}}
					className="outliner__item-button"
				>
					<i className="outliner__item-button-icon delete"></i>
				</button>
			</div>
		</div>
	);
};

interface OutlinerBoxListProps {
	boxList: BoxEntity[];
	setActiveBox: (box: BoxEntity | null) => void;
	deleteBox: (boxName: string) => void;
	activeBox: BoxEntity | null;
	configurateBox: (box: BoxEntity, dictionaryRelation: DictionaryRelation[]) => void;
	dictionaryLinks: DictionaryRelation[];
	dictionaryNamesList: string[];
	configuratePin: (pin: Pin, boxName: string) => void;
}

const OutlinerBoxList = ({
	boxList,
	setActiveBox,
	deleteBox,
	activeBox,
	configurateBox,
	dictionaryLinks,
	dictionaryNamesList,
	configuratePin,
}: OutlinerBoxListProps) => {
	const [editableBox, setEditableBox] = React.useState<BoxEntity | null>(null);
	const [editablePin, setEditablePin] = React.useState<{
		pin: Pin;
		box: string;
	} | null>(null);
	const [isBoxCreateModalOpen, setIsBoxCreateModalOpen] = React.useState(false);

	return (
		<>

			<div className="outliner__list">
				{boxList.map(box => (
					<OutlinerBoxListItem
						key={`${box.name}`}
						box={box}
						setActiveBox={setActiveBox}
						setEditableBox={setEditableBox}
						setIsBoxCreateModalOpen={setIsBoxCreateModalOpen}
						deleteBox={deleteBox}
						activeBox={activeBox}
					/>
				))}
			</div>
			{
				editableBox !== null
				&& <ModalPortal isOpen={isBoxCreateModalOpen}>
					<BoxSettings
						box={editableBox}
						configurateBox={configurateBox}
						onClose={() => setIsBoxCreateModalOpen(false)}
						relatedDictionary={dictionaryLinks.filter(link => link.box === editableBox.name)}
						dictionaryNamesList={dictionaryNamesList}
						setEditablePin={pin => {
							setEditablePin({
								pin,
								box: editableBox.name,
							});
							setIsBoxCreateModalOpen(false);
						}}
					/>
				</ModalPortal>
			}
			{
				editablePin !== null
				&& <ModalPortal isOpen={Boolean(editablePin)}>
					<PinConfigurator
						pin={editablePin.pin}
						configuratePin={configuratePin}
						boxName={editablePin.box}
						onClose={() => {
							setEditablePin(null);
						}}
					/>
				</ModalPortal>
			}
		</>
	);
};

export default OutlinerBoxList;
