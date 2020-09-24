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
import { BoxEntity, DictionaryRelation, Pin } from '../../models/Box';
import { createBemElement } from '../../helpers/styleCreators';

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
	setBoxParamValue: (boxName: string, paramName: string, value: string) => Promise<void>;
	addDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
	changeCustomConfig: (config: {
		[prop: string]: string;
	}, boxName: string) => Promise<void>;
	deleteParam: (paramName: string, boxName: string) => void;
	setImageInfo: (imageProp: {
		name: 'image-name' | 'image-version' | 'node-port';
		value: string;
	}, boxName: string) => void;
	addPinToBox: (pin: Pin, boxName: string) => void;
	removePinFromBox: (pin: Pin, boxName: string) => void;
	activeBox: BoxEntity | null;
}

const OutlinerBoxList = ({
	boxList,
	setActiveBox,
	deleteBox,
	setBoxParamValue,
	addDictionaryRelation,
	changeCustomConfig,
	deleteParam,
	setImageInfo,
	addPinToBox,
	removePinFromBox,
	activeBox,
}: OutlinerBoxListProps) => {
	const [editableBox, setEditableBox] = React.useState<BoxEntity | null>(null);
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
						onParamValueChange={setBoxParamValue}
						onClose={() => setIsBoxCreateModalOpen(false)}
						addDictionaryRelation={addDictionaryRelation}
						changeCustomConfig={changeCustomConfig}
						deleteParam={deleteParam}
						setImageInfo={setImageInfo}
						addPinToBox={addPinToBox}
						removePinFromBox={removePinFromBox}
					/>
				</ModalPortal>
			}
		</>
	);
};

export default OutlinerBoxList;
