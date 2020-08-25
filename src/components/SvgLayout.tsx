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
import '../styles/svg-layout.scss';
import { ConnectionArrow } from '../models/Box';

interface SvgLayoutProps {
	connections: ConnectionArrow[];
}

const SvgLayout = ({
	connections,
}: SvgLayoutProps) => (
	<svg
		preserveAspectRatio="none"
		xmlns="http://www.w3.org/2000/svg"
		className='svg-layout'>
		{
			connections.map(connection => (
				<>
					<path
						key={
							`${connection.start.left}${connection.start.top}
							${connection.end.left}${connection.end.top}arrow`
						}
						d={
							`M ${connection.start.left},${connection.start.top} 
							C ${connection.end.left - ((connection.end.left - connection.start.left) / 5)},
							${connection.start.top} 
							${connection.start.left + ((connection.end.left - connection.start.left) / 5)},
							${connection.end.top} 
							${connection.end.left},${connection.end.top}`
						}
						stroke='#00997F'
						strokeWidth='2'
						fill='none'
					/>
					<polygon
						key={
							`${connection.start.left}${connection.start.top}
							${connection.end.left}${connection.end.top}poligon`
						}
						points={
							`${connection.end.left},${connection.end.top}
							 ${connection.end.left - (connection.end.left > connection.start.left ? 7 : -7)},
							 ${connection.end.top - 5}
							 ${connection.end.left - (connection.end.left > connection.start.left ? 7 : -7)},
							 ${connection.end.top + 5}`
						}
						fill='#00997F'
					/>
				</>
			))
		}
	</svg>
);

export default SvgLayout;
