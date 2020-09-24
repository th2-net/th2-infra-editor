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
import { BoxEntity } from '../../models/Box';
import { Link } from '../../models/LinksDefinition';

interface OutlinerLinkListItemProps {
	link: Link;
	setSelectedLink: (link: string | null) => void;
	deleteConnection: (connection: Link) => Promise<void>;
	outlinerSelectedLink: string | null;
	boxes: BoxEntity[];
}

const OutlinerLinkListItem = ({
	link,
	setSelectedLink,
	deleteConnection,
	outlinerSelectedLink,
	boxes,
}: OutlinerLinkListItemProps) => {
	const isValid = React.useMemo(
		() => boxes.some(box => box.name === link.from.box) && boxes.some(box => box.name === link.to.box),
		[boxes],
	);

	const itemClass = createBemElement(
		'outliner',
		'list-item',
		isValid && link.name === outlinerSelectedLink ? 'highlighted' : null,
		!isValid ? 'invalid' : null,
	);

	return (
		<div
			key={`${link.name}-${link.from.box}-${link.to.box}`}
			onMouseOver={() => setSelectedLink(link.name)}
			onMouseLeave={() => setSelectedLink(null)}
			className={itemClass}
		>
			<div className="outliner__item-info">
				<span className="outliner__info-key">Name:</span>
				<span className="outliner__info-value">{link.name}</span>
			</div>
			<div className="outliner__item-info">
				<span className="outliner__info-key">Connection type:</span>
				<span className="outliner__info-value">{link.from.connectionType}</span>
			</div>
			<div className="outliner__item-info">
				<span className="outliner__info-key">From</span>
				<div className="outliner__item-subinfo">
					<span className="outliner__info-key">Box:</span>
					<span className="outliner__info-value">{link.from.box}</span>
				</div>
				<div className="outliner__item-subinfo">
					<span className="outliner__info-key">Pin:</span>
					<span className="outliner__info-value">{link.from.pin}</span>
				</div>
			</div>
			<div className="outliner__item-info">
				<span className="outliner__info-key">To</span>
				<div className="outliner__item-subinfo">
					<span className="outliner__info-key">Box:</span>
					<span className="outliner__info-value">{link.to.box}</span>
				</div>
				<div className="outliner__item-subinfo">
					<span className="outliner__info-key">Pin:</span>
					<span className="outliner__info-value">{link.to.pin}</span>
				</div>
			</div>
			<div className="outliner__item-control-buttons">
				<button
					onClick={() => {
						// eslint-disable-next-line no-alert
						if (window.confirm(`Are you sure you want to delete link ${link.name}`)) {
							deleteConnection(link);
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

interface OutlinerLinkListProps {
	linkList: Link[];
	setSelectedLink: (link: string | null) => void;
	deleteConnection: (connection: Link) => Promise<void>;
	outlinerSelectedLink: string | null;
	boxes: BoxEntity[];
}

const OutlinerLinkList = ({
	linkList,
	setSelectedLink,
	deleteConnection,
	outlinerSelectedLink,
	boxes,
}: OutlinerLinkListProps) => (
	<div className="outliner__list">
		{linkList.map(link => (
			<OutlinerLinkListItem
				key={`${link.from.box}${link.from.pin}${link.to.box}${link.to.pin}`}
				link={link}
				setSelectedLink={setSelectedLink}
				deleteConnection={deleteConnection}
				outlinerSelectedLink={outlinerSelectedLink}
				boxes={boxes}
			/>
		))}
	</div>
);

export default OutlinerLinkList;
