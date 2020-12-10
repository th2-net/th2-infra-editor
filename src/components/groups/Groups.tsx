/** ****************************************************************************
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
import Group from './Group';
import SvgLayout from '../SvgLayout';
import useSchemasStore from '../../hooks/useSchemasStore';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import '../../styles/group.scss';

const Groups = () => {
	const schemasStore = useSchemasStore();
	const connectionsStore = useConnectionsStore();

	const groupsRef = React.useRef<HTMLDivElement>(null);

	return (
		<div className='groups__wrapper'>
			<div ref={groupsRef} className='groups'>
				<div
					className='groups__list'
					style={{
						gridTemplateColumns: `repeat(${Math.max(
							schemasStore.types.length,
							6,
						)}, 252px)`,
					}}>
					{schemasStore.groups.map(group => {
						const boxes = schemasStore.boxes.filter(box =>
							group.types.some(type => type === box.spec.type),
						);

						return (
							<Group
								key={group.title}
								title={group.title}
								boxes={boxes.sort((first, second) =>
									first.name > second.name ? 1 : -1,
								)}
								groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}
								color={group.color}
							/>
						);
					})}
					<Group
						boxes={schemasStore.boxes.filter(box =>
							schemasStore.groups.every(
								group => !group.types.includes(box.spec.type),
							),
						)}
						color='#CACC66'
						title='Th2Resources'
						groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}
					/>
				</div>
			</div>
			<SvgLayout arrows={connectionsStore.connectionsArrows} />
		</div>
	);
};

export default observer(Groups);
