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

import React, { Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { useDropzone } from 'react-dropzone';
import yaml from 'js-yaml';
import Group from './Group';
import SvgLayout from '../SvgLayout';
import { isFileBase } from '../../models/FileBase';
import { isLinksDefinition } from '../../models/LinksDefinition';
import { readFileAsText } from '../../helpers/files';
import { isValidBox } from '../../helpers/box';
import '../../styles/group.scss';
import useSchemasStore from '../../hooks/useSchemasStore';
import useConnectionsStore from '../../hooks/useConnectionsStore';

const Groups = () => {
	const schemasStore = useSchemasStore();
	const connectionStore = useConnectionsStore();

	const groupsRef = React.useRef<HTMLDivElement>(null);

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
					schemasStore.addBox(parsedYamlFile);
				}

				if (isLinksDefinition(parsedYamlFile)) {
					connectionStore.setLinks([parsedYamlFile]);
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
		<div {...getRootProps()} className="groups__wrapper">
			<div ref={groupsRef} className="groups">
				<input {...getInputProps()}/>
				<div
					className="groups__list"
					style={{
						gridTemplateColumns: `repeat(${Math.max(schemasStore.kinds.length, 6)}, 252px)`,
					}}>
					{
						schemasStore.groups.map(group => {
							const boxes = schemasStore.boxes.filter(box => group.kinds.some(kind => kind === box.kind));
							return boxes.length > 0
								? <Group
									key={group.title}
									title={group.title}
									boxes={boxes.sort((first, second) => (first.name > second.name ? 1 : -1))}
									groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}
									color={group.color} />
								: <Fragment key={group.title}></Fragment>;
						})
					}
					{
						schemasStore.kinds
							.filter(kind => schemasStore
								.groups.every(group => group.kinds
									.every(groupKind => groupKind !== kind)))
							.map(kind => (
								<Group
									key={kind}
									title={kind}
									boxes={schemasStore.boxes.filter(box => box.kind === kind)
										.sort((first, second) => (first.name > second.name ? 1 : -1))}
									groupsTopOffset={groupsRef.current?.getBoundingClientRect().top}
									color={'#C066CC'} />
							))
					}
				</div>
			</div>
			<SvgLayout
				connections={connectionStore.connections}
				deleteConnection={connectionStore.deleteConnection}
			/>
		</div>
	);
};

export default observer(Groups);
