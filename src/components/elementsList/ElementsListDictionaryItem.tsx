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
import { downloadFile } from '../../helpers/files';
import { openConfirmModal } from '../../helpers/modal';
import { createBemElement } from '../../helpers/styleCreators';
import { DictionaryEntity } from '../../models/Dictionary';

interface ElementsListDictionaryItemProps {
	dictionary: DictionaryEntity;
	deleteDictionary: (dictionaryName: string) => void;
	setEditableDictionary: (dictionary: DictionaryEntity) => void;
	isFilterPassed: boolean;
}

const ElementsListDictionaryItem = ({
	dictionary,
	deleteDictionary,
	setEditableDictionary,
	isFilterPassed,
}: ElementsListDictionaryItemProps) => {
	const elementClassName = createBemElement(
		'modal',
		'elements-item',
		!isFilterPassed ? 'unmatched' : null,
	);

	const onRemove = async () => {
		if (
			await openConfirmModal(
				`Are you sure you want to delete dictionary "${dictionary.name}"`,
			)
		) {
			deleteDictionary(dictionary.name);
		}
	};

	return (
		<div className={elementClassName}>
			<div className='modal__elements-item-info'>
				<span className='modal__elements-item-info-name'>{dictionary.name}</span>
			</div>
			<div className='modal__elements-item-buttons-wrapper'>
				<button
					onClick={() => setEditableDictionary(dictionary)}
					className='modal__elements-item-button edit'>
					<i className='modal__elements-item-button-icon' />
				</button>
				<button
					onClick={() => downloadFile(dictionary.spec.data, dictionary.name, 'text/xml')}
					className='modal__elements-item-button download'>
					<i className='modal__elements-item-button-icon' />
				</button>
				<button onClick={onRemove} className='modal__elements-item-button delete'>
					<i className='modal__elements-item-button-icon' />
				</button>
			</div>
		</div>
	);
};

export default ElementsListDictionaryItem;
