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
import useConnectionsStore from '../../hooks/useConnectionsStore';
import { Link } from '../../models/LinksDefinition';

interface ElementsListLinkItemProps {
	link: Link;
	deleteConnection: (link: Link) => void;
	getBoxBorderColor: (boxName: string) => string;
	isFilterPassed: boolean;
}

const ElementsListLinkItem = ({
	link,
	deleteConnection,
	getBoxBorderColor,
	isFilterPassed,
}: ElementsListLinkItemProps) => {
	const connectionsStore = useConnectionsStore();

	const elementClass = createBemBlock('element', !isFilterPassed ? 'hidden' : null);

	return (
		<div
			className={elementClass}
			onMouseEnter={() => connectionsStore.setOutlinerSelectedLink(link)}
			onMouseLeave={() => connectionsStore.setOutlinerSelectedLink(null)}>
			<div className='element__header'>
				<span className='element__title'>{link.name}</span>
				<div className='element__buttons-wrapper'>
					<button
						onClick={async e => {
							e.stopPropagation();
							if (
								await openConfirmModal(
									`Are you sure you want to delete link "${link.name}"?`,
								)
							) {
								deleteConnection(link);
							}
						}}
						className='element__button remove'>
						<i className='element__button-icon' />
					</button>
				</div>
			</div>
			<div className='element__body'>
				<div className='element__link'>
					<div
						style={{
							borderColor: getBoxBorderColor(link.from.box),
						}}
						className='element__link-state'>
						<div className='element__info'>
							<i className='element__info-icon boxes' />
							<div className='element__info-value short'>{link.from.box}</div>
						</div>
						<div className='element__info'>
							<i className='element__info-icon pin' />
							<div className='element__info-value short'>{link.from.pin}</div>
						</div>
					</div>
					<div className='element__link-arrow'>
						<svg className='element__link-arrow-svg' xmlns='http://www.w3.org/2000/svg'>
							<line
								x1='0'
								y1='3'
								x2='38'
								y2='3'
								style={{
									stroke:
										link.from.connectionType === 'grpc' ? '#FF5500' : '#7A99B8',
								}}
							/>
							<polygon
								points='40,3 35,6 35,0'
								style={{
									fill:
										link.from.connectionType === 'grpc' ? '#FF5500' : '#7A99B8',
								}}
							/>
						</svg>
						<span className='element__link-arrow-name'>{link.from.connectionType}</span>
					</div>
					<div
						style={{
							borderColor: getBoxBorderColor(link.to.box),
						}}
						className='element__link-state'>
						<div className='element__info'>
							<i className='element__info-icon boxes' />
							<div className='element__info-value short'>{link.to.box}</div>
						</div>
						<div className='element__info'>
							<i className='element__info-icon pin' />
							<div className='element__info-value short'>{link.to.pin}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ElementsListLinkItem;
