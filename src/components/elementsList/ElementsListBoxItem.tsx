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
import { openConfirmModal } from '../../helpers/modal';
import { createBemBlock } from '../../helpers/styleCreators';
import { BoxEntity } from '../../models/Box';

interface ElementsListBoxItemProps {
	box: BoxEntity;
	editBox: () => void;
	deleteBox: (boxName: string) => void;
	activeBox: BoxEntity | null;
	setActiveBox: (box: BoxEntity | null) => void;
	color: string;
	isFilterPassed: boolean;
}

const ElementsListBoxItem = ({
	box,
	editBox,
	deleteBox,
	activeBox,
	setActiveBox,
	color,
	isFilterPassed,
}: ElementsListBoxItemProps) => {
	const elementClassName = createBemBlock(
		'element',
		activeBox && activeBox.name === box.name ? 'active' : null,
		!isFilterPassed ? 'unmatched' : null,
	);

	const onRemove = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		if (await openConfirmModal(`Are you sure you want to delete resource "${box.name}"?`)) {
			deleteBox(box.name);
		}
	};

	const onEdit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		editBox();
	};

	return (
		<div
			onMouseOver={() => setActiveBox(box)}
			onMouseLeave={() => setActiveBox(null)}
			className={elementClassName}>
			<div className='element__header' style={{ backgroundColor: color }}>
				<span className='element__title'>{box.name}</span>
				<div className='element__buttons-wrapper'>
					<button className='element__button remove' onClick={onRemove}>
						<i className='element__button-icon' />
					</button>
					<button className='element__button settings' onClick={onEdit}>
						<i className='element__button-icon' />
					</button>
				</div>
			</div>
			<div className='element__body'>
				<div className='element__info-list'>
					<div className='element__info'>
						<div className='element__info-name'>Type</div>
						<div className='element__info-value'>{box.spec.type}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ElementsListBoxItem;
