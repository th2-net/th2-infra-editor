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
import '../../styles/outliner.scss';
import useSchemasStore from '../../hooks/useSchemasStore';
import useConnectionsStore from '../../hooks/useConnectionsStore';
import OutlinerBoxList from './OutlinerBoxList';
import OutlinerLinkList from './OutlinerLinkList';

const Outliner = () => {
	const schemasStore = useSchemasStore();
	const connectionStore = useConnectionsStore();

	return (
		<>
			<div className="outliner">
				<OutlinerBoxList
					boxList={schemasStore.boxes.sort((a, b) => (a.kind >= b.kind ? 1 : -1))}
					setActiveBox={schemasStore.setActiveBox}
					deleteBox={schemasStore.deleteBox}
					activeBox={schemasStore.activeBox}
					configurateBox={schemasStore.configurateBox}
					dictionaryLinks={
						schemasStore.dictionaryLinksEntity
							? schemasStore.dictionaryLinksEntity.spec['dictionaries-relation']
							: []
					}
				/>
				<OutlinerLinkList
					linkList={connectionStore.links.sort((a, b) => (a.from.box >= b.from.box ? 1 : -1))}
					setSelectedLink={connectionStore.setSelectedLink}
					deleteConnection={connectionStore.deleteConnection}
					outlinerSelectedLink={connectionStore.outlinerSelectedLink}
					boxes={schemasStore.boxes}
				/>
			</div>
		</>
	);
};

export default observer(Outliner);
