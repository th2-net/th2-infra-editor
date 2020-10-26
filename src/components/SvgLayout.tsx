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
import { observer } from 'mobx-react-lite';
import '../styles/svg-layout.scss';
import { createBemElement } from '../helpers/styleCreators';
import useConnectionsStore from '../hooks/useConnectionsStore';
import { LinkArrow } from '../models/Box';

interface ArrowProps {
	connection: LinkArrow;
}

const Arrow = observer(({
	connection,
}: ArrowProps) => {
	const connectionsStore = useConnectionsStore();

	const arrowLineClass = createBemElement(
		'arrow',
		'line',
	);

	const arrowPointerClass = createBemElement(
		'arrow',
		'pointer',
	);

	const getBezierPoints = () =>
		(connection.start.left === connection.end.left
			? `${connection.start.left - (connection.end.top - connection.start.top) / 3},
				${connection.start.top + (connection.end.top - connection.start.top) / 6} 
				${connection.start.left - (connection.end.top - connection.start.top) / 3},
				${connection.end.top - (connection.end.top - connection.start.top) / 6} `
			: `${connection.end.left - ((connection.end.left - connection.start.left) / 5)},
				${connection.start.top} 
				${connection.start.left + ((connection.end.left - connection.start.left) / 5)},
				${connection.end.top}`);

	return (
		<g
			className="arrow"
			onMouseOver={() => connectionsStore.setOutlinerSelectedLink(connection.name)}
			onMouseLeave={() => connectionsStore.setOutlinerSelectedLink(null)}
			pointerEvents="all"
		>
			<path
				d={
					`M ${connection.start.left},${connection.start.top} 
					C ${getBezierPoints()}
					${connection.end.left}, ${connection.end.top}`
				}
				className={arrowLineClass}
			/>
			<polygon
				points={
					`${connection.end.left},${connection.end.top}
					${connection.end.left - (connection.end.left >= connection.start.left ? 7 : -7)},
					${connection.end.top - 5}
					${connection.end.left - (connection.end.left >= connection.start.left ? 7 : -7)},
					${connection.end.top + 5}`
				}
				className={arrowPointerClass}
			/>
		</g>
	);
});

interface SvgLayoutProps {
	connections: LinkArrow[];
}

const SvgLayout = ({
	connections,
}: SvgLayoutProps) => <svg
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
	id="svg-layout">
	{
		connections.map(connection => (
			<Arrow
				key={
					`${connection.name}${connection.start.left}${connection.start.top}
					${connection.end.left}${connection.end.top}`
				}
				connection={connection}
			/>
		))
	}
</svg>;

export default SvgLayout;
