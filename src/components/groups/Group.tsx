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
import Box from '../box/Box';
import { PinsContainerMethods } from '../box/BoxPinsContainer';
import { BoxEntity } from '../../models/Box';
import '../../styles/group.scss';

const GROUP_OFFSET = 150;
interface Props {
	title: string;
	boxes: Array<BoxEntity>;
	groupsTopOffset?: number;
	color: string;
}

const Group = ({ title, boxes, groupsTopOffset, color }: Props) => {
	const boxRefsObject = React.useRef<{
		[key: string]: React.RefObject<PinsContainerMethods>;
	}>({});
	const titleRef = React.useRef<HTMLHeadingElement>(null);

	React.useEffect(() => {
		boxes.forEach(
			box =>
				(boxRefsObject.current[box.name] =
					boxRefsObject.current[box.name] || React.createRef()),
		);
	}, [boxes]);

	const onScroll = () => {
		Object.values(boxRefsObject.current).forEach(boxRef => boxRef.current?.updateConnections());
	};

	return (
		<div className='group-wrapper'>
			<div className='group'>
				<h1 ref={titleRef} className='group__title'>
					{title}
				</h1>
				<div className='group__items'>
					<div
						onScroll={onScroll}
						className='group__items-scroller'
						style={{
							maxHeight: `${window.innerHeight - GROUP_OFFSET}px`,
						}}>
						{boxes.map((box, index) => (
							<Box
								key={`${box.name}-${index}`}
								box={box}
								ref={boxRefsObject.current[box.name]}
								groupsTopOffset={groupsTopOffset}
								titleHeight={
									titleRef.current
										? titleRef.current?.clientHeight +
										  parseInt(
												window.getComputedStyle(titleRef.current)
													.marginBottom,
										  )
										: undefined
								}
								color={color}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

Group.displayName = 'Group';

export default Group;
