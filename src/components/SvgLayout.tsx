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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { isEqual } from '../helpers/object';
import { createBemElement } from '../helpers/styleCreators';
import useConnectionsStore from '../hooks/useConnectionsStore';
import { LinkArrow } from '../models/LinksDefinition';
import '../styles/svg-layout.scss';

interface ArrowProps {
	arrow: LinkArrow;
}

const Arrow = React.memo(
	({ arrow }: ArrowProps) => {
		const arrowLineClass = createBemElement(
			'arrow',
			'line',
			arrow.isHighlighted ? 'highlighted' : null,
		);

		const arrowPointerClass = createBemElement(
			'arrow',
			'pointer',
			arrow.isHighlighted ? 'highlighted' : null,
		);

		const getBezierPoints = () =>
			arrow.start.left === arrow.end.left
				? `${arrow.start.left - (arrow.end.top - arrow.start.top) / 3},
				${arrow.start.top + (arrow.end.top - arrow.start.top) / 6} 
				${arrow.start.left - (arrow.end.top - arrow.start.top) / 3},
				${arrow.end.top - (arrow.end.top - arrow.start.top) / 6} `
				: `${arrow.end.left - (arrow.end.left - arrow.start.left) / 5},
				${arrow.start.top} 
				${arrow.start.left + (arrow.end.left - arrow.start.left) / 5},
				${arrow.end.top}`;

		if (arrow.isHidden) return null;

		return (
			<g className='arrow' pointerEvents='all'>
				<path
					d={`M ${arrow.start.left},${arrow.start.top} 
					C ${getBezierPoints()}
					${arrow.end.left}, ${arrow.end.top}`}
					className={arrowLineClass}
				/>
				<polygon
					points={`${arrow.end.left},${arrow.end.top}
					${arrow.end.left - (arrow.end.left >= arrow.start.left ? 7 : -7)},
					${arrow.end.top - 5}
					${arrow.end.left - (arrow.end.left >= arrow.start.left ? 7 : -7)},
					${arrow.end.top + 5}`}
					className={arrowPointerClass}
				/>
			</g>
		);
	},
	(prevProps: Readonly<ArrowProps>, nextProps: Readonly<ArrowProps>) =>
		isEqual(prevProps, nextProps),
);

Arrow.displayName = 'Arrow';

const SvgLayout = () => {
	const connectionsStore = useConnectionsStore();

	return (
		<svg preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' id='svg-layout'>
			{connectionsStore.connectionsArrows.map(arrow => (
				<Arrow
					key={`${arrow.name}${arrow.start.left}${arrow.start.top}
						${arrow.end.left}${arrow.end.top}`}
					arrow={arrow}
				/>
			))}
		</svg>
	);
};

export default observer(SvgLayout);
