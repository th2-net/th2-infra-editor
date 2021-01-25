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
import { observer, useForceUpdate } from 'mobx-react-lite';
import Group from './Group';
import SvgLayout from '../SvgLayout';
import useSchemasStore from '../../hooks/useSchemasStore';
import '../../styles/group.scss';

const Groups = () => {
	const schemasStore = useSchemasStore();

	const groupsRef = React.useRef<HTMLDivElement>(null);

	const forceUpdate = useForceUpdate();

	React.useEffect(() => {
		forceUpdate();
	}, [groupsRef]);

	return (
		<div className='groups__wrapper'>
			<div ref={groupsRef} className='groups'>
				<div className='groups__list'>
					{schemasStore.groups.map(({ ...group }) => {
						return (
							<Group
								key={group.title}
								groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}
								{...group}
							/>
						);
					})}
				</div>
			</div>
			<SvgLayout />
		</div>
	);
};

export default observer(Groups);
