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
import Box from './Box';
import { BoxEntity } from '../models/Box';
import '../styles/group.scss';

interface Props {
	title: string;
	boxes: Array<BoxEntity>;
}

const Group = (props: Props) => {
	const { title, boxes } = props;

	return (
		<div className="group">
			<h1 className="group__title">
				{title}
			</h1>
			<div className="group__items">
				<div className="group__items-scroller">
					{
						boxes.map((box, index) =>
							<Box
								key={`${box.metadata.name}-${box.apiVersion}-${index}`}
								box={box} />)
					}
				</div>
			</div>
		</div>
	);
};

export default observer(Group);
