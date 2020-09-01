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
import Box, { BoxMethods } from '../box/Box';
import { BoxEntity } from '../../models/Box';
import useStore from '../../hooks/useStore';
import '../../styles/group.scss';

interface Props {
	title: string;
	boxes: Array<BoxEntity>;
	groupsTopOffset?: number;
}

const Group = ({
	title,
	boxes,
	groupsTopOffset,
}: Props) => {
	const { rootStore } = useStore();
	const [boxRefs, setBoxRefs] = React.useState<React.RefObject<BoxMethods>[]>([]);
	const titleRef = React.useRef<HTMLHeadingElement>(null);

	const arrLength = boxes.length;

	React.useEffect(() => {
		setBoxRefs(boxRef => (
		  Array(arrLength).fill('').map((_, i) => boxRef[i] || React.createRef())
		));
	  }, [boxes]);

	const onScroll = () => {
		boxRefs
			.filter(boxRef => boxRef.current?.kind === title)
			.forEach(boxRef => boxRef.current?.updateCoords());
	};

	return (
		<div className="group">
			<h1 ref={titleRef} className="group__title">
				{title}
			</h1>
			<div className="group__items">
				<div onScroll={onScroll} className="group__items-scroller">
					{
						boxes.map((box, index) =>
							<Box
								key={`${box.name}-${index}`}
								box={box}
								ref={boxRefs[index]}
								connectionDirection={rootStore.connectableBoxes
									.find(wrapper => wrapper.box.name === box.name)?.connection}
								groupsTopOffset={groupsTopOffset}
								titleHeight={titleRef.current
									? (titleRef.current?.clientHeight
										+ parseInt(window.getComputedStyle(titleRef.current).marginBottom))
									: undefined} />)
					}
				</div>
			</div>
		</div>
	);
};

export default Group;
