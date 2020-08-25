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
import { useDropzone } from 'react-dropzone';
import yaml from 'js-yaml';
import { readFileAsText } from '../../helpers/files';
import Group from './Group';
import { isValidBox } from '../../helpers/box';
import '../../styles/group.scss';
import { isFileBase } from '../../models/FileBase';
import { isLinksDefinition } from '../../models/LinksDefinition';
import useStore from '../../hooks/useStore';
import { BoxEntity, BoxConnections, BoxEntityWrapper } from '../../models/Box';

interface GroupsProps {
	createNewBox: (box: BoxEntity) => void;
	addNewProp: (prop: {
		name: string;
		value: string;
	}, boxName: string) => void;
	addCoords: (box: BoxEntity, connections: BoxConnections) => void;
	connectableBoxes: BoxEntityWrapper[];
	setConnection: (box: BoxEntity) => void;
	changeCustomConfig: (config: {[prop: string]: string}, boxName: string) => void;
	deleteParam: (paramName: string, boxName: string) => void;
}

const Groups = ({
	createNewBox,
	addNewProp,
	addCoords,
	connectableBoxes,
	setConnection,
	changeCustomConfig,
	deleteParam,
}: GroupsProps) => {
	const { rootStore } = useStore();
	const onDrop = React.useCallback(acceptedFiles => {
		parseYamlFiles(acceptedFiles);
	}, []);

	const parseYamlFiles = (files: FileList | File[]) => {
		Array.from(files).forEach(async file => {
			try {
				const fileDataURL = await readFileAsText(file);
				const parsedYamlFile = yaml.safeLoad(fileDataURL);
				if (!isFileBase(parsedYamlFile)) {
					return;
				}

				if (isValidBox(parsedYamlFile)) {
					rootStore.addBox(parsedYamlFile);
				}

				if (isLinksDefinition(parsedYamlFile)) {
					rootStore.setLinks([parsedYamlFile]);
				}
			} catch (error) {
				console.error('error');
			}
		});
	};

	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		noClick: true,
	});

	return (
		<div {...getRootProps()} className="groups">
			<input {...getInputProps()}/>
			<div
				className="groups__list"
				style={{
					gridTemplateColumns: `repeat(${Math.max(rootStore.groups.length, 6)}, 1fr)`,
				}}>
				{
					rootStore.groups.map(group =>
						<Group
							title={group}
							key={group}
							boxes={rootStore.boxes.filter(box => box.kind === group)}
							onParamBlur={rootStore.setBoxParamValue}
							createNewBox={createNewBox}
							addNewProp={addNewProp}
							addCoords={addCoords}
							connectableBoxes={connectableBoxes}
							setConnection={setConnection}
							changeCustomConfig={changeCustomConfig}
							deleteParam={deleteParam}/>)
				}
			</div>
		</div>
	);
};

export default observer(Groups);
