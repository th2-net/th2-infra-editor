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
import { ConnectionArrow } from '../models/Box';
import '../styles/svg-layout.scss';
import useOutsideClickListener from '../hooks/useOutsideClickListener';
import { Link } from '../models/LinksDefinition';

interface ArrowProps {
	connection: ConnectionArrow;
	deleteConnection: (connection: Link) => void;
}

const Arrow = ({
	connection,
	deleteConnection,
}: ArrowProps) => {
	const [showRemoveButton, setShowRemoveButton] = React.useState(false);
	const arrowRef = React.useRef<SVGGElement>(null);

	useOutsideClickListener(arrowRef, () => setShowRemoveButton(false));

	const deleteArrow = () => {
		// eslint-disable-next-line no-alert
		if (window.confirm('Are you sure you want'
		+ `to delete link "${connection.name}"`)) {
			deleteConnection({
				name: connection.name,
				from: {
					box: connection.start.connectionOwner.box,
					pin: connection.start.connectionOwner.pin,
					connectionType: connection.start.connectionOwner.connectionType,
				},
				to: {
					box: connection.end.connectionOwner.box,
					pin: connection.end.connectionOwner.pin,
					connectionType: connection.end.connectionOwner.connectionType,
				},
			});
		}
	};

	return (
		<>
			<g
				ref={arrowRef}
				className="arrow"
				pointerEvents="all"
			>
				<path
					d={
						`M ${connection.start.left},${connection.start.top} 
						C ${connection.end.left - ((connection.end.left - connection.start.left) / 5)},
						${connection.start.top} 
						${connection.start.left + ((connection.end.left - connection.start.left) / 5)},
						${connection.end.top} 
						${connection.end.left},${connection.end.top}`
					}
					stroke="#00997F"
					strokeWidth="2"
					fill="none"
					className="arrow__part"
				/>
				<path
					d={
						`M ${connection.start.left},${connection.start.top} 
						C ${connection.end.left - ((connection.end.left - connection.start.left) / 5)},
						${connection.start.top} 
						${connection.start.left + ((connection.end.left - connection.start.left) / 5)},
						${connection.end.top} 
						${connection.end.left},${connection.end.top}`
					}
					stroke="none"
					strokeWidth="10"
					fill="none"
					onClick={() => setShowRemoveButton(!showRemoveButton)}
					className="arrow__part"
				/>
				<polygon
					points={
						`${connection.end.left},${connection.end.top}
						${connection.end.left - (connection.end.left > connection.start.left ? 7 : -7)},
						${connection.end.top - 5}
						${connection.end.left - (connection.end.left > connection.start.left ? 7 : -7)},
						${connection.end.top + 5}`
					}
					fill="#00997F"
					className="arrow__part"
				/>
			</g>
			{
				showRemoveButton
				&& <g
					onClick={deleteArrow}
					ref={arrowRef}
				>
					<circle
						r="8"
						cx={
							(connection.start.left + connection.end.left) / 2
						}
						cy={
							(connection.start.top + connection.end.top) / 2
						}
						stroke="#777"
						strokeWidth="1"
						fill="#fff"
						cursor="pointer"
						className="arrow__delete-button"
					/>
					<line
						x1={((connection.start.left + connection.end.left) / 2) - 4}
						y1={((connection.start.top + connection.end.top) / 2) - 4}
						x2={((connection.start.left + connection.end.left) / 2) + 4}
						y2={((connection.start.top + connection.end.top) / 2) + 4}
						stroke="#777"
						strokeWidth="2"
						cursor="pointer"
						className="arrow__delete-button"

					/>
					<line
						x1={((connection.start.left + connection.end.left) / 2) + 4}
						y1={((connection.start.top + connection.end.top) / 2) - 4}
						x2={((connection.start.left + connection.end.left) / 2) - 4}
						y2={((connection.start.top + connection.end.top) / 2) + 4}
						stroke="#777"
						strokeWidth="2"
						cursor="pointer"
						className="arrow__delete-button"
					/>
				</g>
			}
		</>
	);
};

interface SvgLayoutProps {
	connections: ConnectionArrow[];
	deleteConnection: (connection: Link) => void;
}

const SvgLayout = ({
	connections,
	deleteConnection,
}: SvgLayoutProps) => <svg
	preserveAspectRatio="none"
	xmlns="http://www.w3.org/2000/svg"
	id="svg-layout">
	{
		connections.map(connection => (
			<Arrow
				key={
					`${connection.start.left}${connection.start.top}
					${connection.end.left}${connection.end.top}`
				}
				connection={connection}
				deleteConnection={deleteConnection}
			/>
		))
	}
</svg>;

export default SvgLayout;
