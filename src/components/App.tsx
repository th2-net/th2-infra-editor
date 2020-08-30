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
import Groups from './groups/Groups';
import '../styles/root.scss';
import useStore from '../hooks/useStore';
import Header from './Header';

function App() {
	const { rootStore } = useStore();

	React.useEffect(() => {
		rootStore.init();
	}, []);

	return (
		<div className="root">
			<Header
				schemaList={rootStore.schemas}
				selectedSchema={rootStore.selectedSchema}
				createSchema={rootStore.createNewSchema}
				saveChanges={rootStore.saveChanges}
				createNewBox={rootStore.createNewBox}
			/>
			<Groups
				addNewProp={rootStore.addNewProp}
				addCoords={rootStore.addCoords}
				connectableBoxes={rootStore.connectableBoxes}
				setConnection={rootStore.setConnection}
				changeCustomConfig={rootStore.changeCustomConfig}
				deleteParam={rootStore.deleteParam}
				setImageInfo={rootStore.setImageInfo}
				connections={rootStore.connections}
				addBox={rootStore.addBox}
				setLinks={rootStore.setLinks}
				groups={rootStore.groups}
				boxes={rootStore.boxes}
				onParamBlur={rootStore.setBoxParamValue}
				deleteBox={rootStore.deleteBox}
			/>
		</div>
	);
}

export default observer(App);
